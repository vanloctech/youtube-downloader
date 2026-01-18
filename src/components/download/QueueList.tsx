import { Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { QueueItem } from './QueueItem';
import type { DownloadItem } from '@/lib/types';

interface QueueListProps {
  items: DownloadItem[];
  isDownloading: boolean;
  showPlaylistBadge?: boolean;
  currentPlaylistInfo?: {
    index: number;
    total: number;
    title: string;
  } | null;
  onRemove: (id: string) => void;
  onClearCompleted: () => void;
}

export function QueueList({
  items,
  isDownloading,
  showPlaylistBadge,
  currentPlaylistInfo,
  onRemove,
  onClearCompleted,
}: QueueListProps) {
  const completedCount = items.filter(i => i.status === 'completed').length;
  const totalCount = items.length;

  return (
    <div className="flex-1 flex flex-col rounded-lg sm:rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden min-h-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">Queue</span>
          {currentPlaylistInfo && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs hidden xs:flex">
              {currentPlaylistInfo.index}/{currentPlaylistInfo.total}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
              {completedCount}/{totalCount}
            </Badge>
          )}
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCompleted}
              disabled={isDownloading}
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
            >
              <Trash2 className="w-3 h-3 sm:hidden" />
              <span className="hidden sm:inline">Clear done</span>
            </Button>
          )}
        </div>
      </div>

      {/* Queue Items */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3 sm:mb-4">
            <Download className="w-6 h-6 sm:w-8 sm:h-8 opacity-30" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-center">No videos in queue</p>
          <p className="text-[10px] sm:text-xs mt-1 text-muted-foreground/70 text-center">
            Add YouTube URLs above to get started
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
            {items.map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                showPlaylistBadge={showPlaylistBadge}
                disabled={isDownloading}
                onRemove={onRemove}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
