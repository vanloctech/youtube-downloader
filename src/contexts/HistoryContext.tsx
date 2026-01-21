import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { HistoryEntry, HistoryFilter } from '@/lib/types';

interface HistoryContextType {
  entries: HistoryEntry[];
  filter: HistoryFilter;
  search: string;
  loading: boolean;
  totalCount: number;
  maxEntries: number;
  setFilter: (filter: HistoryFilter) => void;
  setSearch: (search: string) => void;
  setMaxEntries: (max: number) => void;
  refreshHistory: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  openFileLocation: (filepath: string) => Promise<void>;
  checkFileExists: (filepath: string) => Promise<boolean>;
  redownload: (entry: HistoryEntry) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

const MAX_HISTORY_KEY = 'youwee_max_history';

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [maxEntries, setMaxEntriesState] = useState(() => {
    const saved = localStorage.getItem(MAX_HISTORY_KEY);
    return saved ? parseInt(saved, 10) : 500;
  });

  const setMaxEntries = useCallback((max: number) => {
    setMaxEntriesState(max);
    localStorage.setItem(MAX_HISTORY_KEY, String(max));
  }, []);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    try {
      const sourceFilter = filter === 'all' ? null : filter;
      const searchParam = search.trim() || null;
      
      const [result, count] = await Promise.all([
        invoke<HistoryEntry[]>('get_history', {
          limit: 500,
          offset: 0,
          sourceFilter,
          search: searchParam,
        }),
        invoke<number>('get_history_count'),
      ]);
      
      setEntries(result);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await invoke('delete_history', { id });
      setEntries(prev => prev.filter(e => e.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete history entry:', error);
      throw error;
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await invoke('clear_history');
      setEntries([]);
      setTotalCount(0);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, []);

  const openFileLocation = useCallback(async (filepath: string) => {
    try {
      await invoke('open_file_location', { filepath });
    } catch (error) {
      console.error('Failed to open file location:', error);
      throw error;
    }
  }, []);

  const checkFileExists = useCallback(async (filepath: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('check_file_exists', { filepath });
    } catch (error) {
      console.error('Failed to check file:', error);
      return false;
    }
  }, []);

  const redownload = useCallback(async (entry: HistoryEntry) => {
    // Check if file already exists
    const exists = await checkFileExists(entry.filepath);
    if (exists) {
      throw new Error('File already exists');
    }

    // Get output path from filepath
    const outputPath = entry.filepath.substring(0, entry.filepath.lastIndexOf('/'));
    
    // Determine source for logging
    const logStderr = localStorage.getItem('youwee_log_stderr') !== 'false';

    try {
      await invoke('download_video', {
        id: `redownload-${Date.now()}`,
        url: entry.url,
        outputPath,
        quality: entry.quality || 'best',
        format: entry.format || 'mp4',
        downloadPlaylist: false,
        videoCodec: 'h264',
        audioBitrate: '192',
        playlistLimit: null,
        subtitleMode: 'off',
        subtitleLangs: '',
        subtitleEmbed: false,
        subtitleFormat: 'srt',
        logStderr,
      });
    } catch (error) {
      console.error('Failed to redownload:', error);
      throw error;
    }
  }, [checkFileExists]);

  // Fetch history on mount and when filter/search changes
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Auto-refresh every 30 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshHistory();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshHistory]);

  return (
    <HistoryContext.Provider
      value={{
        entries,
        filter,
        search,
        loading,
        totalCount,
        maxEntries,
        setFilter,
        setSearch,
        setMaxEntries,
        refreshHistory,
        deleteEntry,
        clearHistory,
        openFileLocation,
        checkFileExists,
        redownload,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
