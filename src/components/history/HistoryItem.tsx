import { useState } from 'react';
import { useHistory } from '@/contexts/HistoryContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HistoryEntry } from '@/lib/types';
import { 
  FolderOpen, 
  Download, 
  Trash2, 
  AlertCircle,
  Clock,
  HardDrive,
  FileVideo,
  Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HistoryItemProps {
  entry: HistoryEntry;
}

// Format file size
function formatSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get source icon
function getSourceIcon(source?: string): string {
  switch (source?.toLowerCase()) {
    case 'youtube': return 'fa-youtube-play';
    case 'tiktok': return 'fa-music';
    case 'facebook': return 'fa-facebook';
    case 'instagram': return 'fa-instagram';
    case 'twitter': return 'fa-twitter';
    default: return 'fa-globe';
  }
}

export function HistoryItem({ entry }: HistoryItemProps) {
  const { openFileLocation, deleteEntry, redownload } = useHistory();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRedownloading, setIsRedownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [redownloadError, setRedownloadError] = useState<string | null>(null);

  const handleOpenFolder = async () => {
    try {
      await openFileLocation(entry.filepath);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(entry.id);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRedownload = async () => {
    setIsRedownloading(true);
    setRedownloadError(null);
    try {
      await redownload(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to redownload';
      setRedownloadError(message);
    } finally {
      setIsRedownloading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group flex gap-3 p-3 rounded-xl border transition-all duration-200',
          'hover:shadow-md hover:border-primary/20',
          !entry.file_exists && 'opacity-60'
        )}
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-muted">
          {entry.thumbnail ? (
            <img
              src={entry.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileVideo className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Source badge */}
          <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center">
            <i className={`fa ${getSourceIcon(entry.source)} text-[10px] text-white`} />
          </div>

          {/* File missing indicator */}
          {!entry.file_exists && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title */}
          <h3 className="font-medium text-sm truncate pr-2" title={entry.title}>
            {entry.title}
          </h3>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            {entry.quality && (
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {entry.quality}
                </span>
              </span>
            )}
            {entry.format && (
              <span className="uppercase font-medium">{entry.format}</span>
            )}
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatSize(entry.filesize)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(entry.downloaded_at)}
            </span>
          </div>

          {/* Error message */}
          {redownloadError && (
            <p className="text-xs text-destructive mt-1">{redownloadError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {entry.file_exists ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleOpenFolder}
              title="Open folder"
            >
              <FolderOpen className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedownload}
              disabled={isRedownloading}
              title="Re-download"
            >
              {isRedownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete from history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{entry.title}" from your download history. 
              The downloaded file will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
