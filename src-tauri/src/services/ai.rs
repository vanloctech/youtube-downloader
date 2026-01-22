use reqwest::Client;
use serde::{Deserialize, Serialize};

/// AI Provider options
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AIProvider {
    Gemini,
    OpenAI,
    Ollama,
}

impl Default for AIProvider {
    fn default() -> Self {
        AIProvider::Gemini
    }
}

/// Summary style options
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SummaryStyle {
    Short,    // 2-3 sentences
    Detailed, // Bullet points with key information
}

impl Default for SummaryStyle {
    fn default() -> Self {
        SummaryStyle::Short
    }
}

/// AI Configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AIConfig {
    pub enabled: bool,
    pub provider: AIProvider,
    pub api_key: Option<String>,
    pub model: String,
    pub ollama_url: Option<String>,
    pub summary_style: SummaryStyle,
    pub summary_language: String, // "auto", "en", "vi", "ja", etc.
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            provider: AIProvider::Gemini,
            api_key: None,
            model: "gemini-2.0-flash".to_string(),
            ollama_url: Some("http://localhost:11434".to_string()),
            summary_style: SummaryStyle::Short,
            summary_language: "auto".to_string(),
        }
    }
}

/// AI Summary result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SummaryResult {
    pub summary: String,
    pub provider: String,
    pub model: String,
}

/// Error types for AI operations
#[derive(Debug)]
pub enum AIError {
    NoApiKey,
    NoTranscript,
    ApiError(String),
    NetworkError(String),
    ParseError(String),
}

impl std::fmt::Display for AIError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AIError::NoApiKey => write!(f, "API key not configured. Please add your API key in Settings."),
            AIError::NoTranscript => write!(f, "No transcript available for this video."),
            AIError::ApiError(msg) => write!(f, "AI API error: {}", msg),
            AIError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            AIError::ParseError(msg) => write!(f, "Failed to parse response: {}", msg),
        }
    }
}

impl From<AIError> for String {
    fn from(err: AIError) -> String {
        err.to_string()
    }
}

/// Build prompt based on style and language
fn build_prompt(transcript: &str, style: &SummaryStyle, language: &str) -> String {
    let style_instruction = match style {
        SummaryStyle::Short => "Provide a concise summary in 2-3 sentences.",
        SummaryStyle::Detailed => "Provide a detailed summary with bullet points covering the main topics and key takeaways.",
    };
    
    let language_instruction = if language == "auto" {
        "Respond in the same language as the transcript."
    } else {
        &format!("Respond in {}.", match language {
            "en" => "English",
            "vi" => "Vietnamese",
            "ja" => "Japanese",
            "ko" => "Korean",
            "zh" => "Chinese",
            "es" => "Spanish",
            "fr" => "French",
            "de" => "German",
            "pt" => "Portuguese",
            "ru" => "Russian",
            _ => language,
        })
    };
    
    // Truncate transcript if too long (keep ~8000 chars for context window)
    let max_len = 8000;
    let truncated = if transcript.len() > max_len {
        format!("{}... [truncated]", &transcript[..max_len])
    } else {
        transcript.to_string()
    };
    
    format!(
        "You are a helpful assistant that summarizes video content.\n\n\
        {}\n\
        {}\n\n\
        Here is the video transcript:\n\n\
        {}\n\n\
        Summary:",
        style_instruction, language_instruction, truncated
    )
}

/// Generate summary using Gemini API
pub async fn generate_with_gemini(
    api_key: &str,
    model: &str,
    transcript: &str,
    style: &SummaryStyle,
    language: &str,
) -> Result<SummaryResult, AIError> {
    let client = Client::new();
    let prompt = build_prompt(transcript, style, language);
    
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );
    
    let body = serde_json::json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        }
    });
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| AIError::NetworkError(e.to_string()))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(AIError::ApiError(format!("Status {}: {}", status, text)));
    }
    
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AIError::ParseError(e.to_string()))?;
    
    let summary = json
        .get("candidates")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.get(0))
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
        .ok_or_else(|| AIError::ParseError("No text in response".to_string()))?;
    
    Ok(SummaryResult {
        summary: summary.trim().to_string(),
        provider: "Gemini".to_string(),
        model: model.to_string(),
    })
}

/// Generate summary using OpenAI API
pub async fn generate_with_openai(
    api_key: &str,
    model: &str,
    transcript: &str,
    style: &SummaryStyle,
    language: &str,
) -> Result<SummaryResult, AIError> {
    let client = Client::new();
    let prompt = build_prompt(transcript, style, language);
    
    let body = serde_json::json!({
        "model": model,
        "messages": [{
            "role": "user",
            "content": prompt
        }],
        "temperature": 0.7,
        "max_tokens": 1024,
    });
    
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| AIError::NetworkError(e.to_string()))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(AIError::ApiError(format!("Status {}: {}", status, text)));
    }
    
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AIError::ParseError(e.to_string()))?;
    
    let summary = json
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|t| t.as_str())
        .ok_or_else(|| AIError::ParseError("No content in response".to_string()))?;
    
    Ok(SummaryResult {
        summary: summary.trim().to_string(),
        provider: "OpenAI".to_string(),
        model: model.to_string(),
    })
}

/// Generate summary using Ollama (local)
pub async fn generate_with_ollama(
    ollama_url: &str,
    model: &str,
    transcript: &str,
    style: &SummaryStyle,
    language: &str,
) -> Result<SummaryResult, AIError> {
    let client = Client::new();
    let prompt = build_prompt(transcript, style, language);
    
    let url = format!("{}/api/generate", ollama_url.trim_end_matches('/'));
    
    let body = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": 0.7,
        }
    });
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| AIError::NetworkError(format!("Failed to connect to Ollama at {}: {}", ollama_url, e)))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(AIError::ApiError(format!("Status {}: {}", status, text)));
    }
    
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AIError::ParseError(e.to_string()))?;
    
    let summary = json
        .get("response")
        .and_then(|t| t.as_str())
        .ok_or_else(|| AIError::ParseError("No response in Ollama output".to_string()))?;
    
    Ok(SummaryResult {
        summary: summary.trim().to_string(),
        provider: "Ollama".to_string(),
        model: model.to_string(),
    })
}

/// Generate summary based on config
pub async fn generate_summary(
    config: &AIConfig,
    transcript: &str,
) -> Result<SummaryResult, AIError> {
    if transcript.trim().is_empty() {
        return Err(AIError::NoTranscript);
    }
    
    match config.provider {
        AIProvider::Gemini => {
            let api_key = config.api_key.as_ref().ok_or(AIError::NoApiKey)?;
            generate_with_gemini(api_key, &config.model, transcript, &config.summary_style, &config.summary_language).await
        }
        AIProvider::OpenAI => {
            let api_key = config.api_key.as_ref().ok_or(AIError::NoApiKey)?;
            generate_with_openai(api_key, &config.model, transcript, &config.summary_style, &config.summary_language).await
        }
        AIProvider::Ollama => {
            let ollama_url = config.ollama_url.as_ref().map(|s| s.as_str()).unwrap_or("http://localhost:11434");
            generate_with_ollama(ollama_url, &config.model, transcript, &config.summary_style, &config.summary_language).await
        }
    }
}

/// Test AI connection with a simple prompt
pub async fn test_connection(config: &AIConfig) -> Result<String, AIError> {
    let test_transcript = "This is a test video about programming tutorials.";
    let result = generate_summary(config, test_transcript).await?;
    Ok(format!("Connection successful! Using {} with model {}", result.provider, result.model))
}
