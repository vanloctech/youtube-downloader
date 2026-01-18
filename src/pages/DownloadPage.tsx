import { Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UrlInput, SettingsPanel, QueueList } from '@/components/download';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { useDownload } from '@/hooks/useDownload';

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

  // Calculate total duration for file size estimate (sum of all pending items)
  // For now we'll use a sample duration - in real app this would come from video info
  const estimatedDuration = items.length > 0 ? 300 : undefined; // 5 min average

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 sm:h-14 px-3 sm:px-6 border-b bg-card/30 backdrop-blur-xl">
        <h1 className="text-base sm:text-lg font-semibold">Download</h1>
        <ThemePicker />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* URL Input */}
        <div className="rounded-lg sm:rounded-xl border bg-card/50 backdrop-blur-sm p-3 sm:p-4">
          <UrlInput
            disabled={isDownloading}
            onAddUrls={addFromText}
            onImportFile={importFromFile}
            onImportClipboard={importFromClipboard}
          />
        </div>

        {/* Settings */}
        <SettingsPanel
          settings={settings}
          disabled={isDownloading}
          estimatedDuration={estimatedDuration}
          onQualityChange={updateQuality}
          onFormatChange={updateFormat}
          onVideoCodecChange={updateVideoCodec}
          onAudioBitrateChange={updateAudioBitrate}
          onPlaylistToggle={togglePlaylist}
          onSelectFolder={selectOutputFolder}
        />

        {/* Queue */}
        <QueueList
          items={items}
          isDownloading={isDownloading}
          showPlaylistBadge={settings.downloadPlaylist}
          currentPlaylistInfo={currentPlaylistInfo}
          onRemove={removeItem}
          onClearCompleted={clearCompleted}
        />
      </div>

      {/* Footer Actions */}
      <footer className="flex-shrink-0 border-t bg-card/30 backdrop-blur-xl">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {!isDownloading ? (
              <button 
                className="flex-1 h-10 px-4 rounded-md font-medium text-sm sm:text-base btn-gradient flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={startDownload}
                disabled={items.length === 0}
              >
                <Play className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Start Download</span>
                <span className="xs:hidden">Start</span>
                {pendingCount > 0 && <span className="ml-1">({pendingCount})</span>}
              </button>
            ) : (
              <Button 
                className="flex-1 text-sm sm:text-base" 
                size="default"
                variant="destructive"
                onClick={stopDownload}
              >
                <Square className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Stop Download</span>
                <span className="xs:hidden">Stop</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              onClick={clearAll}
              disabled={isDownloading || items.length === 0}
              className="px-3 sm:px-4"
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
