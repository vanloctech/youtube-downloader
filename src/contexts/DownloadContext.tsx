import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { downloadDir } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import type { 
  DownloadItem, 
  DownloadSettings, 
  DownloadProgress, 
  Quality, 
  Format,
  VideoCodec,
  AudioBitrate,
} from '@/lib/types';

const STORAGE_KEY = 'youwee-settings';

// Load settings from localStorage
function loadSavedSettings(): Partial<DownloadSettings> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load saved settings:', e);
  }
  return {};
}

// Save settings to localStorage
function saveSettings(settings: DownloadSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      outputPath: settings.outputPath,
      quality: settings.quality,
      format: settings.format,
      downloadPlaylist: settings.downloadPlaylist,
      videoCodec: settings.videoCodec,
      audioBitrate: settings.audioBitrate,
      concurrentDownloads: settings.concurrentDownloads,
      playlistLimit: settings.playlistLimit,
    }));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

interface PlaylistInfo {
  index: number;
  total: number;
  title: string;
}

interface DownloadContextType {
  items: DownloadItem[];
  isDownloading: boolean;
  settings: DownloadSettings;
  currentPlaylistInfo: PlaylistInfo | null;
  addFromText: (text: string) => number;
  importFromFile: () => Promise<number>;
  importFromClipboard: () => Promise<number>;
  selectOutputFolder: () => Promise<void>;
  removeItem: (id: string) => void;
  clearAll: () => void;
  clearCompleted: () => void;
  startDownload: () => Promise<void>;
  stopDownload: () => Promise<void>;
  updateSettings: (updates: Partial<DownloadSettings>) => void;
  updateQuality: (quality: Quality) => void;
  updateFormat: (format: Format) => void;
  updateVideoCodec: (codec: VideoCodec) => void;
  updateAudioBitrate: (bitrate: AudioBitrate) => void;
  updateConcurrentDownloads: (concurrent: number) => void;
  updatePlaylistLimit: (limit: number) => void;
  togglePlaylist: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Load saved settings on init
  const [settings, setSettings] = useState<DownloadSettings>(() => {
    const saved = loadSavedSettings();
    return {
      quality: saved.quality || 'best',
      format: saved.format || 'mp4',
      outputPath: saved.outputPath || '',
      downloadPlaylist: saved.downloadPlaylist || false,
      videoCodec: saved.videoCodec || 'h264',
      audioBitrate: saved.audioBitrate || 'auto',
      concurrentDownloads: saved.concurrentDownloads || 1,
      playlistLimit: saved.playlistLimit || 0, // 0 = unlimited
    };
  });
  
  const [currentPlaylistInfo, setCurrentPlaylistInfo] = useState<PlaylistInfo | null>(null);
  
  const isDownloadingRef = useRef(false);
  const itemsRef = useRef<DownloadItem[]>([]);
  
  // Keep itemsRef in sync with items state
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Get default download path on mount (only if not saved)
  useEffect(() => {
    const getDefaultPath = async () => {
      // Only fetch default if no saved path
      if (settings.outputPath) return;
      
      try {
        const path = await downloadDir();
        setSettings(s => {
          const newSettings = { ...s, outputPath: path };
          saveSettings(newSettings);
          return newSettings;
        });
      } catch (error) {
        console.error('Failed to get download directory:', error);
      }
    };
    getDefaultPath();
  }, []);

  // Listen for progress updates from Rust backend - runs once at app start
  useEffect(() => {
    const unlisten = listen<DownloadProgress>('download-progress', (event) => {
      const progress = event.payload;
      
      if (progress.playlist_index && progress.playlist_count) {
        setCurrentPlaylistInfo({
          index: progress.playlist_index,
          total: progress.playlist_count,
          title: progress.title || '',
        });
      }
      
      setItems(currentItems => currentItems.map(item => 
        item.id === progress.id 
          ? { 
              ...item, 
              progress: progress.percent,
              speed: progress.speed,
              eta: progress.eta,
              title: progress.title || item.title,
              status: progress.status === 'finished' ? 'completed' : 
                      progress.status === 'error' ? 'error' : 'downloading',
              playlistIndex: progress.playlist_index,
              playlistTotal: progress.playlist_count,
            }
          : item
      ));
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const parseUrls = useCallback((text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) return false;
        // Check for valid YouTube URLs
        return line.includes('youtube.com') || line.includes('youtu.be');
      });
  }, []);

  const addUrls = useCallback((urls: string[]) => {
    if (urls.length === 0) return 0;

    const currentItems = itemsRef.current;
    const newItems: DownloadItem[] = urls
      .filter(url => !currentItems.some(item => item.url === url))
      .map(url => ({
        id: crypto.randomUUID(),
        url,
        title: url,
        status: 'pending' as const,
        progress: 0,
        speed: '',
        eta: '',
        isPlaylist: url.includes('list='),
      }));
    
    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }
    
    return newItems.length;
  }, []);

  const addFromText = useCallback((text: string): number => {
    const urls = parseUrls(text);
    return addUrls(urls);
  }, [parseUrls, addUrls]);

  const importFromFile = useCallback(async (): Promise<number> => {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: 'Text files', extensions: ['txt'] }],
        title: 'Import URLs from file',
      });
      
      if (!file) return 0;
      
      const content = await readTextFile(file as string);
      return addFromText(content);
    } catch (error) {
      console.error('Failed to import file:', error);
      return 0;
    }
  }, [addFromText]);

  const importFromClipboard = useCallback(async (): Promise<number> => {
    try {
      const text = await navigator.clipboard.readText();
      return addFromText(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return 0;
    }
  }, [addFromText]);

  const selectOutputFolder = useCallback(async () => {
    try {
      const folder = await open({
        directory: true,
        multiple: false,
        title: 'Select Download Folder',
        defaultPath: settings.outputPath || undefined,
      });
      
      if (folder) {
        setSettings(s => {
          const newSettings = { ...s, outputPath: folder as string };
          saveSettings(newSettings);
          return newSettings;
        });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  }, [settings.outputPath]);

  const removeItem = useCallback((id: string) => {
    setItems(items => items.filter(item => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setCurrentPlaylistInfo(null);
  }, []);

  const clearCompleted = useCallback(() => {
    setItems(items => items.filter(item => item.status !== 'completed'));
  }, []);

  const startDownload = useCallback(async () => {
    const currentItems = itemsRef.current;
    // Only download items that are pending or had errors (not completed ones)
    const itemsToDownload = currentItems.filter(
      item => item.status === 'pending' || item.status === 'error'
    );
    
    if (itemsToDownload.length === 0) return;
    
    setIsDownloading(true);
    isDownloadingRef.current = true;
    setCurrentPlaylistInfo(null);
    
    // Reset only pending/error items, keep completed items as-is
    setItems(items => items.map(item => {
      if (item.status === 'pending' || item.status === 'error') {
        return {
          ...item,
          status: 'pending' as const,
          progress: 0,
          speed: '',
          eta: '',
          error: undefined,
          playlistIndex: undefined,
          playlistTotal: undefined,
        };
      }
      return item;
    }));

    const concurrentLimit = settings.concurrentDownloads || 1;
    
    // Download single item
    const downloadItem = async (item: DownloadItem) => {
      if (!isDownloadingRef.current) return;
      
      setItems(items => items.map(i => 
        i.id === item.id ? { ...i, status: 'downloading' } : i
      ));

      try {
        await invoke('download_video', {
          id: item.id,
          url: item.url,
          outputPath: settings.outputPath,
          quality: settings.quality,
          format: settings.format,
          downloadPlaylist: settings.downloadPlaylist,
          videoCodec: settings.videoCodec,
          audioBitrate: settings.audioBitrate,
          playlistLimit: settings.playlistLimit,
        });
        
        setItems(items => items.map(i => 
          i.id === item.id ? { ...i, status: 'completed', progress: 100 } : i
        ));
      } catch (error) {
        setItems(items => items.map(i => 
          i.id === item.id ? { ...i, status: 'error', error: String(error) } : i
        ));
      }
    };

    try {
      // Process items with concurrency limit
      const queue = [...itemsToDownload];
      const activeDownloads: Promise<void>[] = [];
      
      const processNext = async (): Promise<void> => {
        while (isDownloadingRef.current && queue.length > 0) {
          const item = queue.shift();
          if (!item) break;
          await downloadItem(item);
        }
      };
      
      // Calculate worker count BEFORE starting (queue.length changes during shift)
      const workerCount = Math.min(concurrentLimit, itemsToDownload.length);
      
      // Start concurrent workers
      for (let i = 0; i < workerCount; i++) {
        activeDownloads.push(processNext());
      }
      
      await Promise.all(activeDownloads);
    } finally {
      setIsDownloading(false);
      isDownloadingRef.current = false;
      setCurrentPlaylistInfo(null);
    }
  }, [settings]);

  const stopDownload = useCallback(async () => {
    try {
      await invoke('stop_download');
    } catch (error) {
      console.error('Failed to stop download:', error);
    }
    setIsDownloading(false);
    isDownloadingRef.current = false;
    setCurrentPlaylistInfo(null);
  }, []);

  const updateSettings = useCallback((updates: Partial<DownloadSettings>) => {
    setSettings(s => {
      const newSettings = { ...s, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateQuality = useCallback((quality: Quality) => {
    setSettings(s => {
      const newSettings = { ...s, quality };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateFormat = useCallback((format: Format) => {
    setSettings(s => {
      const newSettings = { ...s, format };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateVideoCodec = useCallback((videoCodec: VideoCodec) => {
    setSettings(s => {
      const newSettings = { ...s, videoCodec };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateAudioBitrate = useCallback((audioBitrate: AudioBitrate) => {
    setSettings(s => {
      const newSettings = { ...s, audioBitrate };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updateConcurrentDownloads = useCallback((concurrentDownloads: number) => {
    const value = Math.max(1, Math.min(5, concurrentDownloads));
    setSettings(s => {
      const newSettings = { ...s, concurrentDownloads: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const updatePlaylistLimit = useCallback((playlistLimit: number) => {
    const value = Math.max(0, Math.min(100, playlistLimit)); // 0 = unlimited
    setSettings(s => {
      const newSettings = { ...s, playlistLimit: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const togglePlaylist = useCallback(() => {
    setSettings(s => {
      const newSettings = { ...s, downloadPlaylist: !s.downloadPlaylist };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const value: DownloadContextType = {
    items,
    isDownloading,
    settings,
    currentPlaylistInfo,
    addFromText,
    importFromFile,
    importFromClipboard,
    selectOutputFolder,
    removeItem,
    clearAll,
    clearCompleted,
    startDownload,
    stopDownload,
    updateSettings,
    updateQuality,
    updateFormat,
    updateVideoCodec,
    updateAudioBitrate,
    updateConcurrentDownloads,
    updatePlaylistLimit,
    togglePlaylist,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}
