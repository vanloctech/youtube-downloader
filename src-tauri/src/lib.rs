use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Serialize)]
struct DownloadProgress {
    id: String,
    percent: f64,
    speed: String,
    eta: String,
    status: String,
    title: Option<String>,
    playlist_index: Option<u32>,
    playlist_count: Option<u32>,
}

#[derive(Clone, Serialize, Deserialize)]
#[allow(dead_code)]
struct PlaylistEntry {
    id: String,
    title: String,
    url: String,
}

#[derive(Clone, Serialize)]
#[allow(dead_code)]
struct PlaylistInfo {
    entries: Vec<PlaylistEntry>,
    title: String,
}

/// Video information returned from yt-dlp
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct VideoInfo {
    pub id: String,
    pub title: String,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub channel: Option<String>,
    pub uploader: Option<String>,
    pub upload_date: Option<String>,
    pub view_count: Option<u64>,
    pub description: Option<String>,
    pub is_playlist: bool,
    pub playlist_count: Option<u32>,
}

/// Format option from yt-dlp
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FormatOption {
    pub format_id: String,
    pub ext: String,
    pub resolution: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub filesize: Option<u64>,
    pub filesize_approx: Option<u64>,
    pub tbr: Option<f64>,
    pub format_note: Option<String>,
    pub fps: Option<f64>,
    pub quality: Option<f64>,
}

/// Response containing video info and available formats
#[derive(Clone, Serialize, Debug)]
pub struct VideoInfoResponse {
    pub info: VideoInfo,
    pub formats: Vec<FormatOption>,
}

/// Helper to run yt-dlp command and get JSON output
async fn run_ytdlp_json(app: &AppHandle, args: &[&str]) -> Result<String, String> {
    let sidecar_result = app.shell().sidecar("yt-dlp");
    
    match sidecar_result {
        Ok(sidecar) => {
            let (mut rx, _child) = sidecar
                .args(args)
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
                        if status.code != Some(0) {
                            return Err("yt-dlp command failed".to_string());
                        }
                    }
                    _ => {}
                }
            }
            
            Ok(output)
        }
        Err(_) => {
            // Fallback to system yt-dlp
            let output = Command::new("yt-dlp")
                .args(args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await
                .map_err(|e| format!("Failed to run yt-dlp: {}", e))?;
            
            if !output.status.success() {
                return Err("yt-dlp command failed".to_string());
            }
            
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        }
    }
}

#[tauri::command]
async fn get_video_info(app: AppHandle, url: String) -> Result<VideoInfoResponse, String> {
    // Optimized args for faster fetch:
    // - Skip download
    // - Skip playlist expansion  
    // - Use socket timeout
    // - Skip slow extractors
    let args = [
        "--dump-json",
        "--no-download",
        "--no-playlist",
        "--no-warnings",
        "--socket-timeout", "10",
        "--extractor-args", "youtube:skip=dash,hls",
        &url,
    ];
    
    let json_output = run_ytdlp_json(&app, &args).await?;
    
    // Parse the JSON output
    let json: serde_json::Value = serde_json::from_str(&json_output)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    // Check if it's a playlist
    let is_playlist = json.get("_type").and_then(|v| v.as_str()) == Some("playlist");
    let playlist_count = if is_playlist {
        json.get("playlist_count").and_then(|v| v.as_u64()).map(|v| v as u32)
    } else {
        None
    };
    
    // Extract video info
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
            // Truncate description to first 200 chars
            if s.len() > 200 {
                format!("{}...", &s[..200])
            } else {
                s.to_string()
            }
        }),
        is_playlist,
        playlist_count,
    };
    
    // Extract formats
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

fn build_format_string(quality: &str, format: &str) -> String {
    // Audio-only formats
    if quality == "audio" || format == "mp3" || format == "m4a" || format == "opus" {
        return match format {
            "mp3" => "bestaudio/best".to_string(),
            "m4a" => "bestaudio[ext=m4a]/bestaudio/best".to_string(),
            "opus" => "bestaudio[ext=webm]/bestaudio/best".to_string(),
            _ => "bestaudio[ext=m4a]/bestaudio/best".to_string(),
        };
    }
    
    let height = match quality {
        "4k" => Some("2160"),
        "2k" => Some("1440"),
        "1080" => Some("1080"),
        "720" => Some("720"),
        "480" => Some("480"),
        "360" => Some("360"),
        _ => None,
    };
    
    if format == "mp4" {
        if let Some(h) = height {
            format!("bestvideo[height<={}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={}]+bestaudio/best[height<={}]/best", h, h, h)
        } else {
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best".to_string()
        }
    } else if let Some(h) = height {
        format!("bestvideo[height<={}]+bestaudio/best[height<={}]/best", h, h)
    } else {
        "bestvideo+bestaudio/best".to_string()
    }
}

fn parse_progress(line: &str) -> Option<(f64, String, String, Option<u32>, Option<u32>)> {
    let mut playlist_index: Option<u32> = None;
    let mut playlist_count: Option<u32> = None;
    
    // Check for playlist progress
    if line.contains("Downloading item") {
        let re = regex::Regex::new(r"Downloading item (\d+) of (\d+)").ok()?;
        if let Some(caps) = re.captures(line) {
            playlist_index = caps.get(1).and_then(|m| m.as_str().parse().ok());
            playlist_count = caps.get(2).and_then(|m| m.as_str().parse().ok());
        }
    }
    
    if line.contains("[download]") && line.contains("%") {
        let re = regex::Regex::new(r"(\d+\.?\d*)%.*?(?:at\s+(\S+))?.*?(?:ETA\s+(\S+))?").ok()?;
        if let Some(caps) = re.captures(line) {
            let percent: f64 = caps.get(1)?.as_str().parse().ok()?;
            let speed = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let eta = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            return Some((percent, speed, eta, playlist_index, playlist_count));
        }
    }
    
    None
}

/// Kill all yt-dlp and ffmpeg processes
fn kill_all_download_processes() {
    #[cfg(unix)]
    {
        use std::process::Command as StdCommand;
        // Kill all yt-dlp processes
        StdCommand::new("pkill")
            .args(["-9", "-f", "yt-dlp"])
            .spawn()
            .ok();
        // Kill all ffmpeg processes (yt-dlp spawns these)
        StdCommand::new("pkill")
            .args(["-9", "-f", "ffmpeg"])
            .spawn()
            .ok();
    }
    #[cfg(windows)]
    {
        use std::process::Command as StdCommand;
        StdCommand::new("taskkill")
            .args(["/F", "/IM", "yt-dlp.exe"])
            .spawn()
            .ok();
        StdCommand::new("taskkill")
            .args(["/F", "/IM", "ffmpeg.exe"])
            .spawn()
            .ok();
    }
}

#[tauri::command]
async fn download_video(
    app: AppHandle,
    id: String,
    url: String,
    output_path: String,
    quality: String,
    format: String,
    download_playlist: bool,
) -> Result<(), String> {
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    let format_string = build_format_string(&quality, &format);
    let output_template = format!("{}/%(title)s.%(ext)s", output_path);
    
    let mut args = vec![
        "--newline".to_string(),
        "-f".to_string(),
        format_string,
        "-o".to_string(),
        output_template,
    ];
    
    // Handle playlist option
    if !download_playlist {
        args.push("--no-playlist".to_string());
    }
    
    // Audio formats - extract audio and convert
    let is_audio_format = format == "mp3" || format == "m4a" || format == "opus" || quality == "audio";
    
    if is_audio_format {
        args.push("-x".to_string());
        args.push("--audio-format".to_string());
        match format.as_str() {
            "mp3" => args.push("mp3".to_string()),
            "m4a" => args.push("m4a".to_string()),
            "opus" => args.push("opus".to_string()),
            _ => args.push("mp3".to_string()), // Default to mp3 for audio
        }
        args.push("--audio-quality".to_string());
        args.push("0".to_string()); // Best audio quality
    } else {
        // Video formats - set merge output format
        args.push("--merge-output-format".to_string());
        args.push(format.clone());
    }
    
    args.push(url);
    
    // Try to use bundled sidecar first, fallback to system yt-dlp
    let sidecar_result = app.shell().sidecar("yt-dlp");
    
    match sidecar_result {
        Ok(sidecar) => {
            let (mut rx, child) = sidecar
                .args(&args)
                .spawn()
                .map_err(|e| format!("Failed to start bundled yt-dlp: {}", e))?;
            
            let mut current_title: Option<String> = None;
            let mut current_index: Option<u32> = None;
            let mut total_count: Option<u32> = None;
            
            while let Some(event) = rx.recv().await {
                // Check cancel flag first
                if CANCEL_FLAG.load(Ordering::SeqCst) {
                    child.kill().ok();
                    kill_all_download_processes();
                    return Err("Download cancelled".to_string());
                }
                
                match event {
                    CommandEvent::Stdout(line_bytes) => {
                        let line = String::from_utf8_lossy(&line_bytes);
                        
                        // Check for playlist item info
                        if line.contains("Downloading item") {
                            let re = regex::Regex::new(r"Downloading item (\d+) of (\d+)").ok();
                            if let Some(re) = re {
                                if let Some(caps) = re.captures(&line) {
                                    current_index = caps.get(1).and_then(|m| m.as_str().parse().ok());
                                    total_count = caps.get(2).and_then(|m| m.as_str().parse().ok());
                                }
                            }
                        }
                        
                        // Extract video title from output
                        if line.contains("[download] Destination:") || line.contains("[ExtractAudio]") {
                            if let Some(start) = line.rfind('/') {
                                let filename = &line[start + 1..];
                                if let Some(end) = filename.rfind('.') {
                                    current_title = Some(filename[..end].to_string());
                                }
                            }
                        }
                        
                        if let Some((percent, speed, eta, pi, pc)) = parse_progress(&line) {
                            if pi.is_some() { current_index = pi; }
                            if pc.is_some() { total_count = pc; }
                            
                            let progress = DownloadProgress {
                                id: id.clone(),
                                percent,
                                speed,
                                eta,
                                status: "downloading".to_string(),
                                title: current_title.clone(),
                                playlist_index: current_index,
                                playlist_count: total_count,
                            };
                            app.emit("download-progress", progress).ok();
                        }
                    }
                    CommandEvent::Stderr(_) => {}
                    CommandEvent::Error(err) => {
                        return Err(format!("Process error: {}", err));
                    }
                    CommandEvent::Terminated(status) => {
                        if CANCEL_FLAG.load(Ordering::SeqCst) {
                            return Err("Download cancelled".to_string());
                        }
                        
                        if status.code == Some(0) {
                            let progress = DownloadProgress {
                                id: id.clone(),
                                percent: 100.0,
                                speed: String::new(),
                                eta: String::new(),
                                status: "finished".to_string(),
                                title: current_title.clone(),
                                playlist_index: current_index,
                                playlist_count: total_count,
                            };
                            app.emit("download-progress", progress).ok();
                            return Ok(());
                        } else {
                            return Err("Download failed".to_string());
                        }
                    }
                    _ => {}
                }
            }
            Ok(())
        }
        Err(_) => {
            // Fallback to system yt-dlp using tokio
            let process = Command::new("yt-dlp")
                .args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("Failed to start yt-dlp: {}. Please install yt-dlp: brew install yt-dlp", e))?;
            
            handle_tokio_download(app, id, process).await
        }
    }
}

async fn handle_tokio_download(
    app: AppHandle,
    id: String,
    mut process: tokio::process::Child,
) -> Result<(), String> {
    let stdout = process.stdout.take().ok_or("Failed to get stdout")?;
    let mut reader = BufReader::new(stdout).lines();
    
    let mut current_title: Option<String> = None;
    let mut current_index: Option<u32> = None;
    let mut total_count: Option<u32> = None;
    
    while let Ok(Some(line)) = reader.next_line().await {
        if CANCEL_FLAG.load(Ordering::SeqCst) {
            process.kill().await.ok();
            kill_all_download_processes();
            return Err("Download cancelled".to_string());
        }
        
        // Check for playlist item info
        if line.contains("Downloading item") {
            let re = regex::Regex::new(r"Downloading item (\d+) of (\d+)").ok();
            if let Some(re) = re {
                if let Some(caps) = re.captures(&line) {
                    current_index = caps.get(1).and_then(|m| m.as_str().parse().ok());
                    total_count = caps.get(2).and_then(|m| m.as_str().parse().ok());
                }
            }
        }
        
        // Extract video title from output
        if line.contains("[download] Destination:") {
            if let Some(start) = line.rfind('/') {
                let filename = &line[start + 1..];
                if let Some(end) = filename.rfind('.') {
                    current_title = Some(filename[..end].to_string());
                }
            }
        }
        
        if let Some((percent, speed, eta, pi, pc)) = parse_progress(&line) {
            if pi.is_some() { current_index = pi; }
            if pc.is_some() { total_count = pc; }
            
            let progress = DownloadProgress {
                id: id.clone(),
                percent,
                speed,
                eta,
                status: "downloading".to_string(),
                title: current_title.clone(),
                playlist_index: current_index,
                playlist_count: total_count,
            };
            app.emit("download-progress", progress).ok();
        }
    }
    
    let status = process.wait().await.map_err(|e| format!("Process error: {}", e))?;
    
    if CANCEL_FLAG.load(Ordering::SeqCst) {
        return Err("Download cancelled".to_string());
    }
    
    if status.success() {
        let progress = DownloadProgress {
            id: id.clone(),
            percent: 100.0,
            speed: String::new(),
            eta: String::new(),
            status: "finished".to_string(),
            title: current_title,
            playlist_index: current_index,
            playlist_count: total_count,
        };
        app.emit("download-progress", progress).ok();
        Ok(())
    } else {
        Err("Download failed".to_string())
    }
}

#[tauri::command]
async fn stop_download() -> Result<(), String> {
    // Set cancel flag
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    
    // Kill all yt-dlp and ffmpeg processes immediately
    kill_all_download_processes();
    
    // Wait a bit and kill again to make sure
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    kill_all_download_processes();
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![download_video, stop_download, get_video_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
