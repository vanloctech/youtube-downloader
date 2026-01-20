import { useTheme } from '@/contexts/ThemeContext';
import { useDependencies } from '@/contexts/DependenciesContext';
import { useDownload } from '@/contexts/DownloadContext';
import { useUpdater } from '@/contexts/UpdaterContext';
import { themes } from '@/lib/themes';
import type { ThemeName } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { 
  Check, 
  Sun, 
  Moon, 
  Github, 
  ExternalLink, 
  Terminal,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Gradient backgrounds for theme preview
const themeGradients: Record<ThemeName, string> = {
  midnight: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
  aurora: 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500',
  sunset: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500',
  ocean: 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500',
  forest: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500',
  candy: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
};

export function SettingsPage() {
  const { theme, setTheme, mode, setMode } = useTheme();
  const { settings, updateAutoCheckUpdate } = useDownload();
  const updater = useUpdater();
  
  // Use global dependencies context (cached)
  const {
    ytdlpInfo,
    latestVersion,
    isLoading,
    isChecking,
    isUpdating,
    error,
    updateSuccess,
    checkForUpdate,
    updateYtdlp,
    // FFmpeg
    ffmpegStatus,
    ffmpegLoading,
    ffmpegDownloading,
    ffmpegError,
    ffmpegSuccess,
    checkFfmpeg,
    downloadFfmpeg,
  } = useDependencies();

  // Compare versions to check if update is available
  const isUpdateAvailable = latestVersion && ytdlpInfo && latestVersion !== ytdlpInfo.version;
  
  // App update status helpers
  const isAppUpdateAvailable = updater.status === 'available';
  const isAppChecking = updater.status === 'checking';
  const isAppUpToDate = updater.status === 'up-to-date';
  const isAppError = updater.status === 'error';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-14 px-6">
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      {/* Subtle divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Appearance Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Customize how Youwee looks
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm p-4 space-y-5">
            {/* Mode Toggle - Compact */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => setMode('light')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    mode === 'light'
                      ? 'bg-white dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Light mode"
                >
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Light</span>
                </button>
                <button
                  onClick={() => setMode('dark')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    mode === 'dark'
                      ? 'bg-white dark:bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Dark mode"
                >
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">Dark</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

            {/* Theme Colors - Compact Grid */}
            <div className="space-y-3">
              <span className="text-sm font-medium">Theme</span>
              <div className="flex flex-wrap gap-2">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={cn(
                      'group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
                      theme === t.name
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                    )}
                    title={`${t.label} theme`}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full shadow-sm flex items-center justify-center',
                        themeGradients[t.name]
                      )}
                    >
                      {theme === t.name && (
                        <Check className="w-3 h-3 text-white drop-shadow" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* App Updates Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">App Updates</h2>
            <p className="text-xs text-muted-foreground">
              Keep Youwee up to date
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {/* App update row */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">Youwee</span>
                      <Badge variant="secondary" className="text-xs font-mono bg-black/5 dark:bg-white/10">
                        v0.2.1
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAppChecking ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Checking for updates...
                        </span>
                      ) : isAppUpdateAvailable && updater.updateInfo ? (
                        <span className="text-primary">
                          Update available: v{updater.updateInfo.version}
                        </span>
                      ) : isAppUpToDate ? (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          Up to date
                        </span>
                      ) : isAppError ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          {updater.error || 'Failed to check'}
                        </span>
                      ) : (
                        'Modern YouTube downloader'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAppUpdateAvailable && (
                    <Button
                      size="sm"
                      onClick={updater.downloadAndInstall}
                      className="h-8 rounded-lg"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Update
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={updater.checkForUpdate}
                    disabled={isAppChecking}
                    className="h-8 w-8 rounded-lg"
                    title="Check for updates"
                  >
                    <RefreshCw className={cn(
                      "w-4 h-4",
                      isAppChecking && "animate-spin"
                    )} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Auto update toggle */}
            <div className="px-4 py-3 bg-black/5 dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-update" className="text-xs font-medium cursor-pointer">
                  Auto-check for updates on startup
                </Label>
              </div>
              <Switch
                id="auto-update"
                checked={settings.autoCheckUpdate}
                onCheckedChange={updateAutoCheckUpdate}
              />
            </div>
          </div>
        </div>

        {/* Dependencies Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Dependencies</h2>
            <p className="text-xs text-muted-foreground">
              External tools used by Youwee
            </p>
          </div>

          <div className="space-y-3">
            {/* yt-dlp card */}
            <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                      <Terminal className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">yt-dlp</span>
                        {isLoading ? (
                          <Badge variant="secondary" className="text-xs bg-black/5 dark:bg-white/10">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Loading...
                          </Badge>
                        ) : ytdlpInfo ? (
                          <Badge variant="secondary" className="text-xs font-mono bg-black/5 dark:bg-white/10">
                            {ytdlpInfo.version}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Not found
                          </Badge>
                        )}
                        {ytdlpInfo?.is_bundled && (
                          <Badge variant="outline" className="text-xs">
                            Bundled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isUpdating ? (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Downloading update...
                          </span>
                        ) : updateSuccess ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" />
                            Updated successfully!
                          </span>
                        ) : error ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                          </span>
                        ) : isUpdateAvailable ? (
                          <span className="text-primary">
                            Update available: {latestVersion}
                          </span>
                        ) : latestVersion ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" />
                            Up to date
                          </span>
                        ) : (
                          'Video download engine'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUpdateAvailable && (
                      <Button
                        size="sm"
                        onClick={updateYtdlp}
                        disabled={isUpdating}
                        className="h-8 rounded-lg"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1.5" />
                            Update
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={checkForUpdate}
                      disabled={isChecking || isUpdating || isLoading}
                      className="h-8 w-8 rounded-lg"
                      title="Check for updates"
                    >
                      <RefreshCw className={cn(
                        "w-4 h-4",
                        isChecking && "animate-spin"
                      )} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info footer */}
              <div className="px-4 py-2 bg-black/5 dark:bg-white/[0.02] text-xs text-muted-foreground">
                <a 
                  href="https://github.com/yt-dlp/yt-dlp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Github className="w-3 h-3" />
                  <span>yt-dlp/yt-dlp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* FFmpeg card */}
            <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">FFmpeg</span>
                        {ffmpegLoading ? (
                          <Badge variant="secondary" className="text-xs bg-black/5 dark:bg-white/10">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Checking...
                          </Badge>
                        ) : ffmpegStatus?.installed ? (
                          <Badge variant="secondary" className="text-xs font-mono bg-black/5 dark:bg-white/10">
                            {ffmpegStatus.version || 'Installed'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Not found
                          </Badge>
                        )}
                        {ffmpegStatus?.is_system && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ffmpegDownloading ? (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Downloading FFmpeg...
                          </span>
                        ) : ffmpegSuccess ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" />
                            Installed successfully!
                          </span>
                        ) : ffmpegError ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            {ffmpegError}
                          </span>
                        ) : !ffmpegStatus?.installed ? (
                          <span className="text-amber-500">
                            Required for merging video + audio (2K, 4K, 8K)
                          </span>
                        ) : (
                          'Audio/video processing'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!ffmpegStatus?.installed && !ffmpegLoading && (
                      <Button
                        size="sm"
                        onClick={downloadFfmpeg}
                        disabled={ffmpegDownloading}
                        className="h-8 rounded-lg"
                      >
                        {ffmpegDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1.5" />
                            Install
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={checkFfmpeg}
                      disabled={ffmpegLoading || ffmpegDownloading}
                      className="h-8 w-8 rounded-lg"
                      title="Check FFmpeg"
                    >
                      <RefreshCw className={cn(
                        "w-4 h-4",
                        ffmpegLoading && "animate-spin"
                      )} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info footer */}
              <div className="px-4 py-2 bg-black/5 dark:bg-white/[0.02] text-xs text-muted-foreground">
                <a 
                  href="https://ffmpeg.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <span>ffmpeg.org</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">About</h2>
            <p className="text-xs text-muted-foreground">
              Application information
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {/* App Info Header */}
            <div className="p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/10">
                <img 
                  src="/logo-128.png" 
                  alt="Youwee" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold gradient-text">Youwee</h3>
                <p className="text-sm text-muted-foreground">Version 0.2.1</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Modern YouTube Video Downloader
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

            {/* Description */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                A beautiful, fast, and modern YouTube video downloader built with Tauri and React. 
                Download videos in various qualities (up to 8K) and formats with VP9 codec support for maximum quality.
              </p>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

            {/* Features */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Features</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Batch downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Playlist support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>8K/4K/2K quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>VP9 codec</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Audio extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>6 color themes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Auto updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Concurrent downloads</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

            {/* Tech Stack & Links */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5">Tauri 2.0</span>
                <span className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5">React 19</span>
                <span className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5">yt-dlp</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="https://github.com/vanloctech/youwee" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* License */}
            <div className="px-4 py-3 bg-black/5 dark:bg-white/[0.02] text-xs text-muted-foreground text-center">
              Open source under MIT License • Made with ❤️ by VietNam
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
