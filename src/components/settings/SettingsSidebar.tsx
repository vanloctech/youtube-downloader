import { Globe, Info, Package, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SettingsSectionId } from './searchable-settings';

interface SettingsSidebarProps {
  activeSection: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
}

const SECTIONS: { id: SettingsSectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Palette className="w-4 h-4" /> },
  { id: 'dependencies', label: 'Dependencies', icon: <Package className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Features', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'network', label: 'Network & Auth', icon: <Globe className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <nav className="w-52 flex-shrink-0 border-r border-border/50 p-3 space-y-1">
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeSection === section.id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <span
            className={cn(
              'transition-colors duration-200',
              activeSection === section.id ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {section.icon}
          </span>
          {section.label}
        </button>
      ))}
    </nav>
  );
}
