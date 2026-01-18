import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type Page = 'download' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'download',
    label: 'Download',
    icon: <Download className="w-5 h-5" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { mode, toggleMode } = useTheme();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'sidebar h-full flex flex-col border-r bg-card/50 backdrop-blur-xl',
          isCollapsed ? 'w-[60px]' : 'w-[200px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-primary"
                fill="currentColor"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <span
              className={cn(
                'font-bold text-lg whitespace-nowrap transition-all duration-300',
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
              )}
            >
              Youwee
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    'sidebar-item w-full',
                    currentPage === item.id && 'active'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={cn(
                      'sidebar-item-text',
                      isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 space-y-1 border-t">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMode}
                className="sidebar-item w-full"
              >
                <span className="flex-shrink-0">
                  {mode === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </span>
                <span
                  className={cn(
                    'sidebar-item-text',
                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                  )}
                >
                  {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="sidebar-item w-full"
              >
                <span className="flex-shrink-0">
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <ChevronLeft className="w-5 h-5" />
                  )}
                </span>
                <span
                  className={cn(
                    'sidebar-item-text',
                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
                  )}
                >
                  Collapse
                </span>
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Expand
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
