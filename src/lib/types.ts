export type Quality = 'best' | '4k' | '2k' | '1080' | '720' | '480' | '360' | 'audio';
export type Format = 'mp4' | 'mkv' | 'webm' | 'mp3' | 'm4a' | 'opus';

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
  vcodec: string;
  acodec: string;
  filesize?: number;
  tbr?: number;
  format_note?: string;
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
