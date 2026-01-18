import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  Trash2,
  ListVideo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />;
      case 'downloading':
      case 'fetching':
        return <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-spin flex-shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  const getStatusBadge = () => {
    const badgeClass = "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5";
    
    switch (item.status) {
      case 'completed':
        return (
          <Badge className={cn(badgeClass, "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0")}>
            <span className="hidden xs:inline">Completed</span>
            <span className="xs:hidden">Done</span>
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive" className={badgeClass}>Error</Badge>;
      case 'downloading':
        if (item.playlistIndex && item.playlistTotal) {
          return (
            <Badge className={cn(badgeClass, "bg-primary/10 text-primary hover:bg-primary/20 border-0")}>
              {item.playlistIndex}/{item.playlistTotal}
            </Badge>
          );
        }
        return (
          <Badge className={cn(badgeClass, "bg-primary/10 text-primary hover:bg-primary/20 border-0")}>
            <Loader2 className="w-3 h-3 animate-spin sm:hidden" />
            <span className="hidden sm:inline">Downloading</span>
          </Badge>
        );
      case 'fetching':
        return (
          <Badge className={cn(badgeClass, "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0")}>
            <span className="hidden sm:inline">Fetching</span>
            <span className="sm:hidden">...</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary" className={badgeClass}>Pending</Badge>;
    }
  };

  // Extract video ID for thumbnail
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(item.url);
  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <div
      className={cn(
        "queue-item group relative flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200",
        item.status === 'downloading' && "bg-primary/5 border-primary/20",
        item.status === 'completed' && "bg-emerald-500/5 border-emerald-500/20",
        item.status === 'error' && "bg-destructive/5 border-destructive/20",
        item.status === 'pending' && "bg-card/50 hover:bg-card"
      )}
    >
      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="flex-shrink-0 w-14 h-9 xs:w-16 xs:h-10 sm:w-20 sm:h-12 md:w-24 md:h-14 rounded-md sm:rounded-lg overflow-hidden bg-muted">
          <img 
            src={thumbnailUrl} 
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {getStatusIcon()}
          <div className="flex-1 min-w-0 max-w-[120px] xs:max-w-[180px] sm:max-w-none">
            <p className="text-xs sm:text-sm font-medium truncate leading-tight" title={item.title}>
              {item.title}
            </p>
          </div>
          {/* Mobile: Show badge inline with title */}
          <div className="flex items-center gap-1 sm:hidden">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-70"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Playlist indicator */}
        {item.isPlaylist && showPlaylistBadge && (
          <div className="flex items-center gap-1">
            <ListVideo className="w-3 h-3 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Playlist</span>
          </div>
        )}
        
        {/* Progress */}
        {item.status === 'downloading' && (
          <div className="space-y-0.5 sm:space-y-1">
            <div className="h-1 sm:h-1.5 rounded-full overflow-hidden bg-muted">
              <div 
                className="h-full progress-animated rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span>{item.progress.toFixed(0)}%</span>
                {item.playlistIndex && item.playlistTotal && (
                  <span className="text-primary hidden xs:inline">
                    ({item.playlistIndex}/{item.playlistTotal})
                  </span>
                )}
              </span>
              <span className="hidden xs:inline">
                {item.speed}
                {item.eta && <span className="hidden sm:inline"> • ETA: {item.eta}</span>}
              </span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {item.status === 'error' && item.error && (
          <p className="text-[10px] sm:text-xs text-destructive truncate">{item.error}</p>
        )}
      </div>

      {/* Desktop Actions - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2">
        {getStatusBadge()}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
