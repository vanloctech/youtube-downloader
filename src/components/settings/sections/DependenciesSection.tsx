import {
  AlertCircle,
  ExternalLink,
  Film,
  Github,
  Loader2,
  Package,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDependencies } from '@/contexts/DependenciesContext';
import { useDownload } from '@/contexts/DownloadContext';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingsSection } from '../SettingsSection';

interface DependenciesSectionProps {
  highlightId?: string | null;
}

export function DependenciesSection({ highlightId }: DependenciesSectionProps) {
  const { settings, updateUseBunRuntime, updateUseActualPlayerJs } = useDownload();
  const {
    // yt-dlp
    ytdlpInfo,
    isLoading,
    isChecking,
    isUpdating,
    latestVersion,
    updateSuccess,
    error,
    checkForUpdate,
    updateYtdlp,
    // FFmpeg
    ffmpegStatus,
    ffmpegLoading,
    ffmpegDownloading,
    ffmpegCheckingUpdate,
    ffmpegUpdateInfo,
    ffmpegError,
    ffmpegSuccess,
    checkFfmpegUpdate,
    downloadFfmpeg,
    // Bun
    bunStatus,
    bunLoading,
    bunDownloading,
    bunCheckingUpdate,
    bunUpdateInfo,
    bunError,
    bunSuccess,
    checkBunUpdate,
    downloadBun,
  } = useDependencies();

  const isUpdateAvailable = ytdlpInfo?.update_available ?? false;

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Dependencies"
        description="External tools for downloading"
        icon={<Package className="w-5 h-5 text-white" />}
        iconClassName="bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20"
      >
        {/* yt-dlp */}
        <SettingsCard id="ytdlp" highlight={highlightId === 'ytdlp'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">yt-dlp</span>
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : ytdlpInfo ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {ytdlpInfo.version}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Not found
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isUpdating ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating...
                    </span>
                  ) : updateSuccess ? (
                    <span className="text-emerald-500">Updated!</span>
                  ) : error ? (
                    <span className="text-destructive">{error}</span>
                  ) : isUpdateAvailable ? (
                    <span className="text-primary">{latestVersion} available</span>
                  ) : latestVersion ? (
                    <span className="text-emerald-500">Up to date</span>
                  ) : (
                    'Video download engine'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isUpdateAvailable && (
                <Button size="sm" onClick={updateYtdlp} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={checkForUpdate}
                disabled={isChecking || isUpdating}
              >
                <RefreshCw className={cn('w-4 h-4', isChecking && 'animate-spin')} />
              </Button>
            </div>
          </div>
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 pt-3 border-t border-border/50"
          >
            <Github className="w-3 h-3" />
            yt-dlp/yt-dlp
            <ExternalLink className="w-3 h-3" />
          </a>
        </SettingsCard>

        {/* FFmpeg */}
        <SettingsCard id="ffmpeg" highlight={highlightId === 'ffmpeg'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">FFmpeg</span>
                  {ffmpegLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : ffmpegStatus?.installed ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {ffmpegStatus.version || 'Installed'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Not found
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ffmpegDownloading ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {ffmpegUpdateInfo?.has_update ? 'Updating...' : 'Installing...'}
                    </span>
                  ) : ffmpegCheckingUpdate ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking for updates...
                    </span>
                  ) : ffmpegSuccess ? (
                    <span className="text-emerald-500">
                      {ffmpegUpdateInfo?.has_update ? 'Updated!' : 'Installed!'}
                    </span>
                  ) : ffmpegError ? (
                    <span className="text-destructive">{ffmpegError}</span>
                  ) : ffmpegUpdateInfo?.has_update ? (
                    <span className="text-primary">
                      {ffmpegUpdateInfo.latest_version} available
                    </span>
                  ) : ffmpegUpdateInfo && !ffmpegUpdateInfo.has_update ? (
                    <span className="text-emerald-500">Up to date</span>
                  ) : !ffmpegStatus?.installed ? (
                    <span className="text-amber-500">Required for 2K/4K/8K videos</span>
                  ) : ffmpegStatus?.is_system ? (
                    'System FFmpeg - update via package manager'
                  ) : (
                    'Audio/video processing'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ffmpegUpdateInfo?.has_update && !ffmpegStatus?.is_system && (
                <Button size="sm" onClick={downloadFfmpeg} disabled={ffmpegDownloading}>
                  {ffmpegDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
              )}
              {!ffmpegStatus?.installed && !ffmpegLoading && (
                <Button size="sm" onClick={downloadFfmpeg} disabled={ffmpegDownloading}>
                  {ffmpegDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Install'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={checkFfmpegUpdate}
                disabled={
                  ffmpegLoading ||
                  ffmpegDownloading ||
                  ffmpegCheckingUpdate ||
                  !ffmpegStatus?.installed ||
                  ffmpegStatus?.is_system
                }
                title="Check for updates"
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4',
                    (ffmpegLoading || ffmpegCheckingUpdate) && 'animate-spin',
                  )}
                />
              </Button>
            </div>
          </div>
          <a
            href="https://ffmpeg.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 pt-3 border-t border-border/50"
          >
            ffmpeg.org
            <ExternalLink className="w-3 h-3" />
          </a>
        </SettingsCard>

        {/* Bun Runtime */}
        <SettingsCard id="bun" highlight={highlightId === 'bun'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Bun Runtime</span>
                  {bunLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : bunStatus?.installed ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {bunStatus.version || 'Installed'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bunDownloading ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {bunUpdateInfo?.has_update ? 'Updating...' : 'Installing...'}
                    </span>
                  ) : bunCheckingUpdate ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking for updates...
                    </span>
                  ) : bunSuccess ? (
                    <span className="text-emerald-500">
                      {bunUpdateInfo?.has_update ? 'Updated!' : 'Installed!'}
                    </span>
                  ) : bunError ? (
                    <span className="text-destructive">{bunError}</span>
                  ) : bunUpdateInfo?.has_update ? (
                    <span className="text-primary">{bunUpdateInfo.latest_version} available</span>
                  ) : bunUpdateInfo && !bunUpdateInfo.has_update ? (
                    <span className="text-emerald-500">Up to date</span>
                  ) : !bunStatus?.installed ? (
                    <span className="text-amber-500">
                      Enable in download settings if only 360p available
                    </span>
                  ) : bunStatus?.is_system ? (
                    'System Bun - update via package manager'
                  ) : (
                    'JavaScript runtime for YouTube'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bunUpdateInfo?.has_update && !bunStatus?.is_system && (
                <Button size="sm" onClick={downloadBun} disabled={bunDownloading}>
                  {bunDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
              )}
              {!bunStatus?.installed && !bunLoading && (
                <Button size="sm" onClick={downloadBun} disabled={bunDownloading}>
                  {bunDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Install'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={checkBunUpdate}
                disabled={
                  bunLoading ||
                  bunDownloading ||
                  bunCheckingUpdate ||
                  !bunStatus?.installed ||
                  bunStatus?.is_system
                }
                title="Check for updates"
              >
                <RefreshCw
                  className={cn('w-4 h-4', (bunLoading || bunCheckingUpdate) && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Use Bun for YouTube</p>
                <p className="text-xs text-muted-foreground">
                  Fixes 360p-only issue on some systems
                </p>
              </div>
              <Switch
                checked={settings.useBunRuntime}
                onCheckedChange={updateUseBunRuntime}
                disabled={!bunStatus?.installed}
              />
            </div>
          </div>
          <a
            href="https://bun.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 pt-3 border-t border-border/50"
          >
            bun.sh
            <ExternalLink className="w-3 h-3" />
          </a>
        </SettingsCard>

        {/* YouTube Troubleshooting */}
        <SettingsCard
          id="youtube-troubleshooting"
          highlight={highlightId === 'youtube-troubleshooting'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-medium">YouTube Troubleshooting</span>
              <p className="text-xs text-muted-foreground mt-0.5">Options to fix download issues</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Use Actual Player.js</p>
                <p className="text-xs text-muted-foreground">
                  Fixes "unable to download" errors on some videos
                </p>
              </div>
              <Switch
                checked={settings.useActualPlayerJs}
                onCheckedChange={updateUseActualPlayerJs}
              />
            </div>
          </div>
          <a
            href="https://github.com/yt-dlp/yt-dlp/issues/14680"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 pt-3 border-t border-border/50"
          >
            Learn more about this issue
            <ExternalLink className="w-3 h-3" />
          </a>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
