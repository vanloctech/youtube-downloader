use std::process::Stdio;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tokio::process::Command;
use crate::types::{VideoInfo, FormatOption, VideoInfoResponse, PlaylistVideoEntry, SubtitleInfo};
use crate::services::run_ytdlp_json;

/// Get video transcript/subtitles for AI summarization
#[tauri::command]
pub async fn get_video_transcript(app: AppHandle, url: String) -> Result<String, String> {
    // Try to get auto-generated subtitles first, then manual subtitles
    let args = [
        "--skip-download",
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang", "en,vi,ja,ko,zh",
        "--sub-format", "vtt/srt/best",
        "--print", "%(subtitles)j",
        "--print", "%(automatic_captions)j",
        "--no-warnings",
        &url,
    ];
    
    let output = run_ytdlp_json(&app, &args).await;
    
    // If we got subtitle data, try to extract text from it
    if let Ok(output_str) = output {
        // Try to parse and extract transcript
        if let Some(transcript) = extract_transcript_from_output(&output_str) {
            if !transcript.trim().is_empty() {
                return Ok(transcript);
            }
        }
    }
    
    // Fallback: Try to get subtitles directly and parse VTT
    let temp_dir = std::env::temp_dir().join("youwee_subs");
    std::fs::create_dir_all(&temp_dir).ok();
    
    let temp_path = temp_dir.join("transcript");
    let temp_path_str = temp_path.to_string_lossy().to_string();
    
    let args = [
        "--skip-download",
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang", "en,vi,ja,ko,zh",
        "--sub-format", "vtt/srt",
        "-o", &temp_path_str,
        "--no-warnings",
        &url,
    ];
    
    let _ = run_ytdlp_json(&app, &args).await;
    
    // Look for downloaded subtitle files
    if let Ok(entries) = std::fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(ext) = path.extension() {
                if ext == "vtt" || ext == "srt" {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        let transcript = parse_subtitle_file(&content);
                        // Clean up
                        std::fs::remove_file(&path).ok();
                        if !transcript.trim().is_empty() {
                            return Ok(transcript);
                        }
                    }
                }
            }
        }
    }
    
    // Clean up temp dir
    std::fs::remove_dir_all(&temp_dir).ok();
    
    Err("No transcript available for this video. The video may not have subtitles.".to_string())
}

/// Extract transcript text from yt-dlp subtitle output
fn extract_transcript_from_output(output: &str) -> Option<String> {
    // yt-dlp outputs JSON with subtitle info
    // Try to parse it and extract text
    for line in output.lines() {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
            // Look for subtitle data in the JSON
            if let Some(obj) = json.as_object() {
                for (_lang, data) in obj {
                    if let Some(arr) = data.as_array() {
                        let mut texts: Vec<String> = Vec::new();
                        for item in arr {
                            // Skip if this is just a URL reference
                            if item.get("url").is_some() {
                                continue;
                            }
                            if let Some(text) = item.get("text").and_then(|v| v.as_str()) {
                                texts.push(text.to_string());
                            }
                        }
                        if !texts.is_empty() {
                            return Some(texts.join(" "));
                        }
                    }
                }
            }
        }
    }
    None
}

/// Parse VTT or SRT subtitle file to plain text
fn parse_subtitle_file(content: &str) -> String {
    let mut texts: Vec<String> = Vec::new();
    
    for line in content.lines() {
        let line = line.trim();
        
        // Skip empty lines
        if line.is_empty() {
            continue;
        }
        
        // Skip VTT header
        if line.starts_with("WEBVTT") || line.starts_with("NOTE") {
            continue;
        }
        
        // Skip timestamp lines (VTT: 00:00:00.000 --> 00:00:00.000, SRT: 00:00:00,000 --> 00:00:00,000)
        if line.contains("-->") {
            continue;
        }
        
        // Skip numeric cue identifiers (SRT format)
        if line.chars().all(|c| c.is_ascii_digit()) {
            continue;
        }
        
        // Skip position/styling lines
        if line.starts_with("align:") || line.starts_with("position:") || line.contains("::") {
            continue;
        }
        
        // Remove HTML-like tags
        let clean_line = regex::Regex::new(r"<[^>]+>")
            .map(|re| re.replace_all(line, "").to_string())
            .unwrap_or_else(|_| line.to_string());
        
        let clean_line = clean_line.trim();
        
        if !clean_line.is_empty() && !texts.last().map(|l| l == clean_line).unwrap_or(false) {
            texts.push(clean_line.to_string());
        }
    }
    
    texts.join(" ")
}

#[tauri::command]
pub async fn get_video_info(app: AppHandle, url: String) -> Result<VideoInfoResponse, String> {
    let args = [
        "--dump-json",
        "--no-download",
        "--no-playlist",
        "--no-warnings",
        "--socket-timeout", "15",
        &url,
    ];
    
    let json_output = run_ytdlp_json(&app, &args).await?;
    
    let json: serde_json::Value = serde_json::from_str(&json_output)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let is_playlist = json.get("_type").and_then(|v| v.as_str()) == Some("playlist");
    let playlist_count = if is_playlist {
        json.get("playlist_count").and_then(|v| v.as_u64()).map(|v| v as u32)
    } else {
        None
    };
    
    let info = VideoInfo {
        id: json.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title: json.get("title").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
        thumbnail: json.get("thumbnail").and_then(|v| v.as_str()).map(|s| s.to_string()),
        duration: json.get("duration").and_then(|v| v.as_f64()),
        channel: json.get("channel").and_then(|v| v.as_str()).map(|s| s.to_string()),
        uploader: json.get("uploader").and_then(|v| v.as_str()).map(|s| s.to_string()),
        upload_date: json.get("upload_date").and_then(|v| v.as_str()).map(|s| s.to_string()),
        view_count: json.get("view_count").and_then(|v| v.as_u64()),
        description: json.get("description").and_then(|v| v.as_str()).map(|s| {
            if s.len() > 200 {
                format!("{}...", &s[..200])
            } else {
                s.to_string()
            }
        }),
        is_playlist,
        playlist_count,
        extractor: json.get("extractor").and_then(|v| v.as_str()).map(|s| s.to_string()),
        extractor_key: json.get("extractor_key").and_then(|v| v.as_str()).map(|s| s.to_string()),
    };
    
    let formats = if let Some(formats_arr) = json.get("formats").and_then(|v| v.as_array()) {
        formats_arr.iter().filter_map(|f| {
            let format_id = f.get("format_id").and_then(|v| v.as_str())?;
            let ext = f.get("ext").and_then(|v| v.as_str()).unwrap_or("unknown");
            
            Some(FormatOption {
                format_id: format_id.to_string(),
                ext: ext.to_string(),
                resolution: f.get("resolution").and_then(|v| v.as_str()).map(|s| s.to_string()),
                width: f.get("width").and_then(|v| v.as_u64()).map(|v| v as u32),
                height: f.get("height").and_then(|v| v.as_u64()).map(|v| v as u32),
                vcodec: f.get("vcodec").and_then(|v| v.as_str()).map(|s| s.to_string()),
                acodec: f.get("acodec").and_then(|v| v.as_str()).map(|s| s.to_string()),
                filesize: f.get("filesize").and_then(|v| v.as_u64()),
                filesize_approx: f.get("filesize_approx").and_then(|v| v.as_u64()),
                tbr: f.get("tbr").and_then(|v| v.as_f64()),
                format_note: f.get("format_note").and_then(|v| v.as_str()).map(|s| s.to_string()),
                fps: f.get("fps").and_then(|v| v.as_f64()),
                quality: f.get("quality").and_then(|v| v.as_f64()),
            })
        }).collect()
    } else {
        Vec::new()
    };
    
    Ok(VideoInfoResponse { info, formats })
}

#[tauri::command]
pub async fn get_playlist_entries(app: AppHandle, url: String, limit: Option<u32>) -> Result<Vec<PlaylistVideoEntry>, String> {
    let mut args = vec![
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
        "--socket-timeout", "30",
    ];
    
    let limit_str: String;
    if let Some(l) = limit {
        if l > 0 {
            limit_str = l.to_string();
            args.push("--playlist-end");
            args.push(&limit_str);
        }
    }
    
    args.push(&url);
    
    let sidecar_result = app.shell().sidecar("yt-dlp");
    
    let output = match sidecar_result {
        Ok(sidecar) => {
            let (mut rx, _child) = sidecar
                .args(&args)
                .spawn()
                .map_err(|e| format!("Failed to start yt-dlp: {}", e))?;
            
            let mut output = String::new();
            
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(bytes) => {
                        output.push_str(&String::from_utf8_lossy(&bytes));
                    }
                    CommandEvent::Stderr(_) => {}
                    CommandEvent::Error(err) => {
                        return Err(format!("Process error: {}", err));
                    }
                    CommandEvent::Terminated(status) => {
                        if status.code != Some(0) && output.is_empty() {
                            return Err("Failed to fetch playlist info".to_string());
                        }
                    }
                    _ => {}
                }
            }
            
            output
        }
        Err(_) => {
            let result = Command::new("yt-dlp")
                .args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await
                .map_err(|e| format!("Failed to run yt-dlp: {}", e))?;
            
            String::from_utf8_lossy(&result.stdout).to_string()
        }
    };
    
    let mut entries: Vec<PlaylistVideoEntry> = Vec::new();
    
    for line in output.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
            let id = json.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
            
            if id.is_empty() {
                continue;
            }
            
            let title = json.get("title").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
            let video_url = format!("https://www.youtube.com/watch?v={}", id);
            
            let thumbnail = json.get("thumbnail")
                .or_else(|| json.get("thumbnails").and_then(|t| t.as_array()).and_then(|arr| arr.first()))
                .and_then(|v| {
                    if v.is_string() {
                        v.as_str().map(|s| s.to_string())
                    } else {
                        v.get("url").and_then(|u| u.as_str()).map(|s| s.to_string())
                    }
                });
            
            let duration = json.get("duration").and_then(|v| v.as_f64());
            let channel = json.get("channel")
                .or_else(|| json.get("uploader"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            
            entries.push(PlaylistVideoEntry {
                id,
                title,
                url: video_url,
                thumbnail,
                duration,
                channel,
            });
        }
    }
    
    if entries.is_empty() {
        return Err("No videos found in playlist".to_string());
    }
    
    Ok(entries)
}

#[tauri::command]
pub async fn get_available_subtitles(app: AppHandle, url: String) -> Result<Vec<SubtitleInfo>, String> {
    let args = [
        "--list-subs",
        "--skip-download",
        "--no-warnings",
        &url,
    ];
    
    let output = run_ytdlp_json(&app, &args).await;
    
    let mut subtitles: Vec<SubtitleInfo> = Vec::new();
    
    let lang_names: std::collections::HashMap<&str, &str> = [
        ("en", "English"),
        ("vi", "Vietnamese"),
        ("ja", "Japanese"),
        ("ko", "Korean"),
        ("zh", "Chinese"),
        ("zh-Hans", "Chinese (Simplified)"),
        ("zh-Hant", "Chinese (Traditional)"),
        ("th", "Thai"),
        ("id", "Indonesian"),
        ("ms", "Malay"),
        ("fr", "French"),
        ("de", "German"),
        ("es", "Spanish"),
        ("pt", "Portuguese"),
        ("ru", "Russian"),
        ("ar", "Arabic"),
        ("hi", "Hindi"),
        ("it", "Italian"),
        ("nl", "Dutch"),
        ("pl", "Polish"),
        ("tr", "Turkish"),
        ("uk", "Ukrainian"),
    ].iter().cloned().collect();
    
    if let Ok(text) = output {
        let mut is_auto_section = false;
        
        for line in text.lines() {
            let line = line.trim();
            
            if line.contains("automatic captions") || line.contains("auto-generated") {
                is_auto_section = true;
                continue;
            }
            
            if line.contains("subtitles") && !line.contains("auto") {
                is_auto_section = false;
                continue;
            }
            
            if line.is_empty() || line.starts_with("Language") || line.starts_with("[") || line.contains("Available") {
                continue;
            }
            
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(lang_code) = parts.first() {
                let lang = lang_code.to_string();
                if subtitles.iter().any(|s| s.lang == lang && s.is_auto == is_auto_section) {
                    continue;
                }
                
                let name = lang_names.get(lang.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| lang.clone());
                
                subtitles.push(SubtitleInfo {
                    lang,
                    name,
                    is_auto: is_auto_section,
                });
            }
        }
    }
    
    if subtitles.is_empty() {
        subtitles = vec![
            SubtitleInfo { lang: "en".to_string(), name: "English".to_string(), is_auto: false },
            SubtitleInfo { lang: "vi".to_string(), name: "Vietnamese".to_string(), is_auto: false },
            SubtitleInfo { lang: "ja".to_string(), name: "Japanese".to_string(), is_auto: false },
            SubtitleInfo { lang: "ko".to_string(), name: "Korean".to_string(), is_auto: false },
            SubtitleInfo { lang: "zh".to_string(), name: "Chinese".to_string(), is_auto: false },
        ];
    }
    
    Ok(subtitles)
}
