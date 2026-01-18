import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/themes';
import type { ThemeName } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette } from 'lucide-react';

const themeColors: Record<ThemeName, string> = {
  zinc: 'bg-zinc-500',
  ocean: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all',
                  theme === t.name
                    ? 'border-primary bg-accent'
                    : 'border-transparent hover:bg-accent/50'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    themeColors[t.name]
                  )}
                >
                  {theme === t.name && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
