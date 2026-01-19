import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  X,
  ListVideo,
  Play,
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

  const isActive = item.status === 'downloading' || item.status === 'fetching';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isPending = item.status === 'pending';

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-2 rounded-xl transition-all duration-200",
        "bg-card/50 hover:bg-card/80",
        isActive && "bg-primary/5",
        isCompleted && "bg-emerald-500/5",
        isError && "bg-red-500/5"
      )}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-28 h-[72px] sm:w-36 sm:h-20 rounded-lg overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt=""
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isCompleted && "opacity-60"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ListVideo className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Progress Overlay - Only when downloading */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            {/* Progress Bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <div className="h-1 rounded-full overflow-hidden bg-white/20 mb-1">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/90 font-medium">
                <span>{item.progress.toFixed(0)}%</span>
                {item.speed && <span>{item.speed}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {isError && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Pending Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-black ml-0.5" />
            </div>
          </div>
        )}

        {/* Playlist Badge */}
        {item.isPlaylist && showPlaylistBadge && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] flex items-center gap-1">
            <ListVideo className="w-3 h-3" />
            <span>Playlist</span>
          </div>
        )}

        {/* Playlist Progress */}
        {item.playlistIndex && item.playlistTotal && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium tabular-nums">
            {item.playlistIndex}/{item.playlistTotal}
          </div>
        )}

        {/* Duration/ETA Badge */}
        {isActive && item.eta && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium">
            {item.eta}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        {/* Title */}
        <p 
          className={cn(
            "text-sm font-medium leading-snug line-clamp-2 transition-colors",
            isCompleted && "text-muted-foreground"
          )}
          title={item.title}
        >
          {item.title}
        </p>
        
        {/* Status Row */}
        <div className="flex items-center gap-2 mt-1.5">
          {/* Status Badge */}
          <span className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
            isPending && "bg-muted text-muted-foreground",
            isActive && "bg-primary/10 text-primary",
            isCompleted && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            isError && "bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            {isPending && <Clock className="w-3 h-3" />}
            {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
            {isError && <XCircle className="w-3 h-3" />}
            <span>
              {isPending && 'Pending'}
              {isActive && (item.status === 'fetching' ? 'Fetching' : 'Downloading')}
              {isCompleted && 'Completed'}
              {isError && 'Failed'}
            </span>
          </span>
          
          {/* Error Message */}
          {isError && item.error && (
            <span 
              className="text-xs text-red-500/80 truncate max-w-[120px] sm:max-w-[200px]" 
              title={item.error}
            >
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
          "bg-black/50 hover:bg-black/70 text-white/70 hover:text-white",
          "opacity-0 group-hover:opacity-100",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
