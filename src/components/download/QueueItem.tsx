import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  X,
  ListVideo,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DownloadItem } from '@/lib/types';

interface QueueItemProps {
  item: DownloadItem;
  showPlaylistBadge?: boolean;
  disabled?: boolean;
  onRemove: (id: string) => void;
}

export function QueueItem({ 
  item, 
  showPlaylistBadge,
  disabled, 
  onRemove 
}: QueueItemProps) {
  // Extract video ID for thumbnail
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(item.url);
  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  const getStatusInfo = () => {
    switch (item.status) {
      case 'completed':
        return { 
          icon: <CheckCircle2 className="w-4 h-4" />, 
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          label: 'Done'
        };
      case 'error':
        return { 
          icon: <XCircle className="w-4 h-4" />, 
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Error'
        };
      case 'downloading':
      case 'fetching':
        return { 
          icon: <Loader2 className="w-4 h-4 animate-spin" />, 
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          label: item.status === 'fetching' ? 'Fetching...' : 'Downloading'
        };
      default:
        return { 
          icon: <Clock className="w-4 h-4" />, 
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border/50',
          label: 'Pending'
        };
    }
  };

  const status = getStatusInfo();
  const isActive = item.status === 'downloading' || item.status === 'fetching';

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-2 rounded-xl border transition-all duration-200",
        status.bgColor,
        status.borderColor,
        isActive && "ring-1 ring-primary/30"
      )}
    >
      {/* Thumbnail with Progress Overlay */}
      <div className="relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListVideo className="w-6 h-6 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Progress Overlay */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-2 transition-all duration-300">
            {/* Progress Bar */}
            <div className="h-1.5 rounded-full overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 mb-1.5 shadow-sm">
              <div 
                className="h-full progress-animated rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white font-medium drop-shadow-md">
              <span className="tabular-nums">{item.progress.toFixed(0)}%</span>
              {item.speed && <span className="tabular-nums opacity-90">{item.speed}</span>}
            </div>
          </div>
        )}

        {/* Completed Overlay */}
        {item.status === 'completed' && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-lg" />
          </div>
        )}

        {/* Error Overlay */}
        {item.status === 'error' && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-red-500" />
          </div>
        )}

        {/* Playlist Badge on Thumbnail */}
        {item.isPlaylist && showPlaylistBadge && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] flex items-center gap-1">
            <ListVideo className="w-3 h-3" />
            <span>Playlist</span>
          </div>
        )}

        {/* Playlist Progress on Thumbnail */}
        {item.playlistIndex && item.playlistTotal && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
            {item.playlistIndex}/{item.playlistTotal}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Title */}
        <p 
          className="text-sm font-medium leading-tight line-clamp-2" 
          title={item.title}
        >
          {item.title}
        </p>
        
        {/* Status & Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs flex items-center gap-1", status.color)}>
            {status.icon}
            <span className="hidden xs:inline">{status.label}</span>
          </span>
          
          {isActive && item.eta && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ETA: {item.eta}
            </span>
          )}
          
          {item.status === 'error' && item.error && (
            <span className="text-xs text-red-500 truncate max-w-[150px] sm:max-w-none" title={item.error}>
              {item.error}
            </span>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={disabled}
        title="Remove from queue"
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-full transition-all",
          "bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground",
          "opacity-0 group-hover:opacity-100",
          "sm:opacity-0 sm:group-hover:opacity-100",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
