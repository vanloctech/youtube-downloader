import { 
  FolderOpen,
  ListVideo,
  FileVideo,
  Music,
  ChevronDown,
  HardDrive,
  Film,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Quality, Format, DownloadSettings, VideoCodec, AudioBitrate } from '@/lib/types';
import { estimateFileSize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const qualityOptions: { value: Quality; label: string; shortLabel: string; icon?: React.ReactNode }[] = [
  { value: 'best', label: 'Best Available', shortLabel: 'Best' },
  { value: '4k', label: '4K Ultra HD (2160p)', shortLabel: '4K' },
  { value: '2k', label: '2K QHD (1440p)', shortLabel: '2K' },
  { value: '1080', label: '1080p Full HD', shortLabel: '1080p' },
  { value: '720', label: '720p HD', shortLabel: '720p' },
  { value: '480', label: '480p SD', shortLabel: '480p' },
  { value: '360', label: '360p Low', shortLabel: '360p' },
  { value: 'audio', label: 'Audio Only', shortLabel: 'Audio', icon: <Music className="w-4 h-4" /> },
];

const videoFormatOptions: { value: Format; label: string; icon: React.ReactNode }[] = [
  { value: 'mp4', label: 'MP4', icon: <FileVideo className="w-4 h-4" /> },
  { value: 'mkv', label: 'MKV', icon: <FileVideo className="w-4 h-4" /> },
  { value: 'webm', label: 'WebM', icon: <FileVideo className="w-4 h-4" /> },
];

const audioFormatOptions: { value: Format; label: string; icon: React.ReactNode }[] = [
  { value: 'mp3', label: 'MP3', icon: <Music className="w-4 h-4" /> },
  { value: 'm4a', label: 'M4A (AAC)', icon: <Music className="w-4 h-4" /> },
  { value: 'opus', label: 'Opus', icon: <Music className="w-4 h-4" /> },
];

const videoCodecOptions: { value: VideoCodec; label: string; description?: string }[] = [
  { value: 'h264', label: 'H.264', description: 'Tương thích tốt với mọi player' },
  { value: 'auto', label: 'Auto', description: 'Chất lượng tốt nhất (VP9/AV1)' },
];

const audioBitrateOptions: { value: AudioBitrate; label: string }[] = [
  { value: 'auto', label: 'Auto (Best)' },
  { value: '320', label: '320 kbps' },
  { value: '256', label: '256 kbps' },
  { value: '192', label: '192 kbps' },
  { value: '128', label: '128 kbps' },
];

interface SettingsPanelProps {
  settings: DownloadSettings;
  disabled?: boolean;
  estimatedDuration?: number; // Duration in seconds for file size estimation
  onQualityChange: (quality: Quality) => void;
  onFormatChange: (format: Format) => void;
  onVideoCodecChange: (codec: VideoCodec) => void;
  onAudioBitrateChange: (bitrate: AudioBitrate) => void;
  onPlaylistToggle: () => void;
  onSelectFolder: () => void;
}

export function SettingsPanel({
  settings,
  disabled,
  estimatedDuration,
  onQualityChange,
  onFormatChange,
  onVideoCodecChange,
  onAudioBitrateChange,
  onPlaylistToggle,
  onSelectFolder,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine if audio-only mode
  const isAudioOnly = settings.quality === 'audio' || ['mp3', 'm4a', 'opus'].includes(settings.format);
  const formatOptions = isAudioOnly ? audioFormatOptions : videoFormatOptions;

  // Calculate estimated file size
  const fileSizeEstimate = estimatedDuration 
    ? estimateFileSize(estimatedDuration, settings.quality, settings.format, settings.audioBitrate)
    : '';

  // Handle quality change - auto-switch format if needed
  const handleQualityChange = (quality: Quality) => {
    onQualityChange(quality);
    
    // If switching to audio, auto-set format to mp3
    if (quality === 'audio' && !['mp3', 'm4a', 'opus'].includes(settings.format)) {
      onFormatChange('mp3');
    }
    // If switching from audio to video, auto-set format to mp4
    if (quality !== 'audio' && ['mp3', 'm4a', 'opus'].includes(settings.format)) {
      onFormatChange('mp4');
    }
  };

  const getQualityLabel = () => {
    const opt = qualityOptions.find(o => o.value === settings.quality);
    return opt?.shortLabel || settings.quality;
  };

  const getCodecLabel = () => {
    return settings.videoCodec === 'h264' ? 'H.264' : 'Auto';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg sm:rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-2.5 sm:p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-medium">Settings</span>
              {settings.downloadPlaylist && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs hidden xs:flex">
                  <ListVideo className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Playlist</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="font-normal text-[10px] sm:text-xs px-1.5 sm:px-2">
                {getQualityLabel()} • {settings.format.toUpperCase()}
                {!isAudioOnly && <span className="hidden sm:inline"> • {getCodecLabel()}</span>}
              </Badge>
              {fileSizeEstimate && (
                <Badge variant="outline" className="font-normal text-[10px] sm:text-xs px-1.5 sm:px-2 hidden xs:flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {fileSizeEstimate}
                </Badge>
              )}
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-2.5 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
            {/* Quality & Format */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Quality</Label>
                <Select
                  value={settings.quality}
                  onValueChange={handleQualityChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-background/50 h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          {opt.icon}
                          <span className="hidden sm:inline">{opt.label}</span>
                          <span className="sm:hidden">{opt.shortLabel}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Format</Label>
                <Select
                  value={settings.format}
                  onValueChange={onFormatChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-background/50 h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video Codec & Audio Bitrate */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Video Codec - only show for video formats */}
              {!isAudioOnly ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Video Codec
                  </Label>
                  <Select
                    value={settings.videoCodec}
                    onValueChange={onVideoCodecChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-background/50 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoCodecOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm">{opt.label}</span>
                            {opt.description && (
                              <span className="text-[10px] text-muted-foreground hidden sm:block">{opt.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Audio Bitrate
                  </Label>
                  <Select
                    value={settings.audioBitrate}
                    onValueChange={onAudioBitrateChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-background/50 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioBitrateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="text-xs sm:text-sm">{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Audio Bitrate - show for video too (audio track bitrate) */}
              {!isAudioOnly && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Audio Bitrate
                  </Label>
                  <Select
                    value={settings.audioBitrate}
                    onValueChange={onAudioBitrateChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-background/50 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioBitrateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="text-xs sm:text-sm">{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* File Size Estimate */}
            {fileSizeEstimate && (
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-accent/30">
                <HardDrive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Estimated file size: <span className="font-medium text-foreground">{fileSizeEstimate}</span>
                </span>
              </div>
            )}

            {/* Playlist Toggle */}
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-accent/30">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <ListVideo className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Download Playlist</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden xs:block">
                    Download all videos in playlist
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.downloadPlaylist}
                onCheckedChange={onPlaylistToggle}
                disabled={disabled}
              />
            </div>

            {/* Output Folder */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Output Folder</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.outputPath}
                  readOnly
                  className="flex-1 font-mono text-[10px] sm:text-xs bg-background/50 h-8 sm:h-10"
                  placeholder="Select folder..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSelectFolder}
                  disabled={disabled}
                  className="h-8 sm:h-10 px-2 sm:px-3"
                >
                  <FolderOpen className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Browse</span>
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
