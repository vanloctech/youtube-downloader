import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AIConfig, AIProvider, ModelOption, LanguageOption } from '@/lib/types';

interface AIContextValue {
  config: AIConfig;
  isLoading: boolean;
  isTesting: boolean;
  isGenerating: boolean;
  testResult: { success: boolean; message: string } | null;
  models: ModelOption[];
  languages: LanguageOption[];
  
  // Actions
  updateConfig: (updates: Partial<AIConfig>) => Promise<void>;
  testConnection: () => Promise<void>;
  generateSummary: (transcript: string, historyId?: string) => Promise<string>;
  fetchTranscript: (url: string) => Promise<string>;
  loadModels: (provider: AIProvider) => void;
}

const defaultConfig: AIConfig = {
  enabled: false,
  provider: 'gemini',
  api_key: undefined,
  model: 'gemini-2.0-flash',
  ollama_url: 'http://localhost:11434',
  summary_style: 'short',
  summary_language: 'auto',
};

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AIConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
    loadLanguages();
  }, []);

  // Load models when provider changes
  useEffect(() => {
    loadModels(config.provider);
  }, [config.provider]);

  const loadConfig = async () => {
    try {
      const savedConfig = await invoke<AIConfig>('get_ai_config');
      setConfig(savedConfig);
    } catch (error) {
      console.error('Failed to load AI config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = useCallback(async (provider: AIProvider) => {
    try {
      const modelList = await invoke<ModelOption[]>('get_ai_models', { provider });
      setModels(modelList);
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels([]);
    }
  }, []);

  const loadLanguages = async () => {
    try {
      const langList = await invoke<LanguageOption[]>('get_summary_languages');
      setLanguages(langList);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const updateConfig = useCallback(async (updates: Partial<AIConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setTestResult(null);
    
    try {
      await invoke('save_ai_config', { config: newConfig });
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  }, [config]);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const message = await invoke<string>('test_ai_connection', { config });
      setTestResult({ success: true, message });
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setIsTesting(false);
    }
  }, [config]);

  const generateSummary = useCallback(async (transcript: string, historyId?: string): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const summary = await invoke<string>('generate_video_summary', {
        transcript,
        historyId: historyId || null,
      });
      return summary;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const fetchTranscript = useCallback(async (url: string): Promise<string> => {
    return await invoke<string>('get_video_transcript', { url });
  }, []);

  return (
    <AIContext.Provider
      value={{
        config,
        isLoading,
        isTesting,
        isGenerating,
        testResult,
        models,
        languages,
        updateConfig,
        testConnection,
        generateSummary,
        fetchTranscript,
        loadModels,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}
