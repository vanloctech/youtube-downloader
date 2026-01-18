import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/themes';
import type { ThemeName } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check, Sun, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';

const themeColors: Record<ThemeName, string> = {
  zinc: 'bg-zinc-500',
  ocean: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
};

export function SettingsPage() {
  const { theme, setTheme, mode, setMode } = useTheme();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-14 px-6 border-b bg-card/30 backdrop-blur-xl">
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Customize the look and feel of the app
            </p>
          </div>

          {/* Mode Selection */}
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <Label className="text-xs text-muted-foreground">Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('light')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  mode === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-accent/30 hover:bg-accent/50'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Light</p>
                  <p className="text-xs text-muted-foreground">Clean & bright</p>
                </div>
                {mode === 'light' && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>

              <button
                onClick={() => setMode('dark')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  mode === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-accent/30 hover:bg-accent/50'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Dark</p>
                  <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                </div>
                {mode === 'dark' && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <Label className="text-xs text-muted-foreground">Theme Color</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    theme === t.name
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-accent/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shadow-lg',
                      themeColors[t.name]
                    )}
                  >
                    {theme === t.name && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">About</h2>
            <p className="text-xs text-muted-foreground">
              App information
            </p>
          </div>

          <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-7 h-7 text-primary"
                  fill="currentColor"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Youwee</h3>
                <p className="text-xs text-muted-foreground">Version 0.1.0</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A modern YouTube video downloader powered by yt-dlp. 
              Download videos in various qualities and formats.
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Built with Tauri + React</span>
              <span>•</span>
              <a 
                href="https://github.com/vanloctech/youtube-downloader" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
