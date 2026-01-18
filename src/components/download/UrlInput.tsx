import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  FileText, 
  ClipboardPaste,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VideoPreview } from './VideoPreview';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  disabled?: boolean;
  onAddUrls: (text: string) => number;
  onImportFile: () => Promise<number>;
  onImportClipboard: () => Promise<number>;
}

function extractFirstUrl(text: string): string | null {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
        return trimmed;
      }
    }
  }
  return null;
}

// Check if URL is a playlist-only URL (no video ID)
function isPlaylistOnlyUrl(url: string): boolean {
  // Playlist-only URLs look like: youtube.com/playlist?list=...
  // They don't have watch?v= or youtu.be/VIDEO_ID
  if (url.includes('/playlist?list=')) {
    return true;
  }
  return false;
}

export function UrlInput({ 
  disabled, 
  onAddUrls, 
  onImportFile,
  onImportClipboard,
}: UrlInputProps) {
  const [value, setValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Auto-show preview when single URL is entered (skip playlist-only URLs)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const lines = value.trim().split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    
    // Only show preview for single URL that's not a playlist-only URL
    if (lines.length === 1) {
      const url = extractFirstUrl(value);
      if (url && url !== previewUrl && !isPlaylistOnlyUrl(url)) {
        debounceRef.current = window.setTimeout(() => {
          setPreviewUrl(url);
          setShowPreview(true);
        }, 500);
      } else if (url && isPlaylistOnlyUrl(url)) {
        // Don't show preview for playlist-only URLs
        setShowPreview(false);
        setPreviewUrl(null);
      }
    } else {
      setShowPreview(false);
      setPreviewUrl(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleAdd = () => {
    const count = onAddUrls(value);
    if (count > 0) {
      setValue('');
      setShowPreview(false);
      setPreviewUrl(null);
    }
  };

  const handleImportFile = async () => {
    setIsImporting(true);
    try {
      await onImportFile();
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClipboard = async () => {
    setIsImporting(true);
    try {
      const count = await onImportClipboard();
      if (count === 0) {
        // If clipboard import added nothing, try pasting into textarea
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            setValue(prev => prev ? `${prev}\n${text}` : text);
          }
        } catch {
          // Clipboard access denied
        }
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleAdd();
    }
  };

  const urlCount = value.trim().split('\n').filter(l => {
    const trimmed = l.trim();
    return trimmed && !trimmed.startsWith('#') && 
           (trimmed.includes('youtube.com') || trimmed.includes('youtu.be'));
  }).length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="Paste YouTube URLs here (one per line)&#10;https://www.youtube.com/watch?v=...&#10;https://youtu.be/...&#10;https://www.youtube.com/playlist?list=..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "min-h-[120px] resize-none font-mono text-sm",
            "bg-background/50 border-border/50",
            "focus:bg-background transition-colors",
            "placeholder:text-muted-foreground/50"
          )}
        />
        {urlCount > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {urlCount} URL{urlCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      {showPreview && previewUrl && (
        <VideoPreview 
          url={previewUrl} 
          onClose={() => {
            setShowPreview(false);
            setPreviewUrl(null);
          }}
        />
      )}
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleAdd} 
          disabled={disabled || !value.trim()}
          className="flex-1 btn-glow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Queue {urlCount > 0 && `(${urlCount})`}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleImportFile}
          disabled={disabled || isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Import TXT</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={handleImportClipboard}
          disabled={disabled || isImporting}
          className="gap-2"
        >
          <ClipboardPaste className="w-4 h-4" />
          <span className="hidden sm:inline">Clipboard</span>
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> to add URLs
      </p>
    </div>
  );
}
