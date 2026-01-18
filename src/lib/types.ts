export type Quality = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | 'audio';
export type Format = 'mp4' | 'mkv' | 'webm' | 'mp3' | 'm4a' | 'opus';
export type VideoCodec = 'auto' | 'h264';
export type AudioBitrate = 'auto' | '128' | '192' | '256' | '320';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  error?: string;
  isPlaylist?: boolean;
  playlistIndex?: number;
  playlistTotal?: number;
  thumbnail?: string;
  duration?: string;
  channel?: string;
}

export interface DownloadSettings {
  quality: Quality;
  format: Format;
  outputPath: string;
  downloadPlaylist: boolean;
  videoCodec: VideoCodec;
  audioBitrate: AudioBitrate;
}

export interface DownloadProgress {
  id: string;
  percent: number;
  speed: string;
  eta: string;
  status: string;
  title?: string;
  playlist_index?: number;
  playlist_count?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  upload_date: string;
  view_count: number;
  is_playlist: boolean;
  playlist_count?: number;
}

export interface FormatOption {
  format_id: string;
  ext: string;
  resolution: string;
  width?: number;
  height?: number;
  vcodec: string;
  acodec: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  abr?: number;
  format_note?: string;
}

export interface VideoInfoResponse {
  info: VideoInfo;
  formats: FormatOption[];
}

export interface PlaylistInfo {
  id: string;
  title: string;
  entries: PlaylistEntry[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

// Helper to estimate file size based on quality and duration
export function estimateFileSize(
  durationSeconds: number,
  quality: Quality,
  format: Format,
  audioBitrate: AudioBitrate
): string {
  if (!durationSeconds || durationSeconds <= 0) return '';

  // Bitrates in kbps (approximate for different qualities)
  const videoBitrates: Record<Quality, number> = {
    'best': 8000,
    '4k': 20000,
    '2k': 12000,
    '1080': 5000,
    '720': 2500,
    '480': 1000,
    '360': 500,
    'audio': 0,
  };

  const audioBitrates: Record<AudioBitrate, number> = {
    'auto': 192,
    '128': 128,
    '192': 192,
    '256': 256,
    '320': 320,
  };

  const isAudioOnly = quality === 'audio' || format === 'mp3' || format === 'm4a' || format === 'opus';
  
  let totalBitrate: number;
  if (isAudioOnly) {
    totalBitrate = audioBitrates[audioBitrate];
  } else {
    totalBitrate = videoBitrates[quality] + audioBitrates[audioBitrate];
  }

  // Calculate size in bytes: (bitrate * duration) / 8
  const sizeBytes = (totalBitrate * 1000 * durationSeconds) / 8;

  // Format size
  if (sizeBytes >= 1024 * 1024 * 1024) {
    return `~${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (sizeBytes >= 1024 * 1024) {
    return `~${(sizeBytes / (1024 * 1024)).toFixed(0)} MB`;
  } else {
    return `~${(sizeBytes / 1024).toFixed(0)} KB`;
  }
}
