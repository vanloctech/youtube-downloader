import { Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UrlInput, SettingsPanel, QueueList } from '@/components/download';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { useDownload } from '@/hooks/useDownload';
import { cn } from '@/lib/utils';

export function DownloadPage() {
  const {
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
    updateQuality,
    updateFormat,
    updateVideoCodec,
    updateAudioBitrate,
    togglePlaylist,
  } = useDownload();

  const pendingCount = items.filter(i => i.status !== 'completed').length;
  const hasItems = items.length > 0;

  // Calculate total file size from fetched video info (in bytes)
  // Only show if we have actual filesize data from videos
  const totalFileSize = items.reduce((sum, item) => {
    return sum + (item.filesize || 0);
  }, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 sm:h-14 px-4 sm:px-6 border-b bg-card/30 backdrop-blur-xl">
        <h1 className="text-base sm:text-lg font-semibold">Download</h1>
        <ThemePicker />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section: URL Input + Settings */}
        <div className="flex-shrink-0 p-4 sm:p-6 space-y-3 border-b bg-card/20">
          {/* URL Input */}
          <UrlInput
            disabled={isDownloading}
            onAddUrls={addFromText}
            onImportFile={importFromFile}
            onImportClipboard={importFromClipboard}
          />

          {/* Settings Bar */}
          <SettingsPanel
            settings={settings}
            disabled={isDownloading}
            totalFileSize={totalFileSize > 0 ? totalFileSize : undefined}
            onQualityChange={updateQuality}
            onFormatChange={updateFormat}
            onVideoCodecChange={updateVideoCodec}
            onAudioBitrateChange={updateAudioBitrate}
            onPlaylistToggle={togglePlaylist}
            onSelectFolder={selectOutputFolder}
          />
        </div>

        {/* Queue Section */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 pt-2">
          <QueueList
            items={items}
            isDownloading={isDownloading}
            showPlaylistBadge={settings.downloadPlaylist}
            currentPlaylistInfo={currentPlaylistInfo}
            onRemove={removeItem}
            onClearCompleted={clearCompleted}
          />
        </div>
      </div>

      {/* Floating Action Bar */}
      <footer className={cn(
        "flex-shrink-0 border-t bg-card/50 backdrop-blur-xl transition-all duration-300",
        hasItems ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            {!isDownloading ? (
              <button 
                className={cn(
                  "flex-1 h-11 px-6 rounded-xl font-medium text-sm sm:text-base",
                  "btn-gradient flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-primary/20",
                  pendingCount > 0 && "animate-pulse-subtle"
                )} 
                onClick={startDownload}
                disabled={pendingCount === 0}
                title="Start downloading all pending videos"
              >
                <Play className="w-5 h-5" />
                <span>Start Download</span>
                {pendingCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            ) : (
              <Button 
                className="flex-1 h-11 text-sm sm:text-base rounded-xl" 
                variant="destructive"
                onClick={stopDownload}
                title="Stop current download"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Download
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={clearAll}
              disabled={isDownloading || items.length === 0}
              className="h-11 w-11 rounded-xl flex-shrink-0"
              title="Clear all items from queue"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
