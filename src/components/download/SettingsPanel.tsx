import { 
  FolderOpen,
  ListVideo,
  FileVideo,
  Music,
  Settings2,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Quality, Format, DownloadSettings, VideoCodec, AudioBitrate } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

const qualityOptions: { value: Quality; label: string; shortLabel: string }[] = [
  { value: 'best', label: 'Best Available', shortLabel: 'Best' },
  { value: '4k', label: '4K (2160p)', shortLabel: '4K' },
  { value: '2k', label: '2K (1440p)', shortLabel: '2K' },
  { value: '1080', label: '1080p', shortLabel: '1080p' },
  { value: '720', label: '720p', shortLabel: '720p' },
  { value: '480', label: '480p', shortLabel: '480p' },
  { value: '360', label: '360p', shortLabel: '360p' },
  { value: 'audio', label: 'Audio Only', shortLabel: 'Audio' },
];

const videoFormatOptions: { value: Format; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' },
];

const audioFormatOptions: { value: Format; label: string }[] = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A' },
  { value: 'opus', label: 'Opus' },
];

const videoCodecOptions: { value: VideoCodec; label: string; desc: string }[] = [
  { value: 'h264', label: 'H.264', desc: 'Best compatibility' },
  { value: 'auto', label: 'Auto', desc: 'Best quality' },
];

const audioBitrateOptions: { value: AudioBitrate; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '320', label: '320k' },
  { value: '256', label: '256k' },
  { value: '192', label: '192k' },
  { value: '128', label: '128k' },
];

interface SettingsPanelProps {
  settings: DownloadSettings;
  disabled?: boolean;
  totalFileSize?: number; // Total file size in bytes from fetched video info
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
  totalFileSize,
  onQualityChange,
  onFormatChange,
  onVideoCodecChange,
  onAudioBitrateChange,
  onPlaylistToggle,
  onSelectFolder,
}: SettingsPanelProps) {
  const isAudioOnly = settings.quality === 'audio' || ['mp3', 'm4a', 'opus'].includes(settings.format);
  const formatOptions = isAudioOnly ? audioFormatOptions : videoFormatOptions;

  // Only show file size if we have actual data from video info
  const fileSizeDisplay = totalFileSize && totalFileSize > 0 
    ? formatFileSize(totalFileSize) 
    : '';

  const handleQualityChange = (quality: Quality) => {
    onQualityChange(quality);
    if (quality === 'audio' && !['mp3', 'm4a', 'opus'].includes(settings.format)) {
      onFormatChange('mp3');
    }
    if (quality !== 'audio' && ['mp3', 'm4a', 'opus'].includes(settings.format)) {
      onFormatChange('mp4');
    }
  };

  const outputFolderName = settings.outputPath 
    ? settings.outputPath.split('/').pop() || settings.outputPath
    : 'Downloads';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quality Select */}
      <Select
        value={settings.quality}
        onValueChange={handleQualityChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className="w-[90px] sm:w-[100px] h-9 text-xs bg-card/50 border-border/50"
          title="Video quality"
        >
          <div className="flex items-center gap-1.5">
            {isAudioOnly ? <Music className="w-3.5 h-3.5" /> : <FileVideo className="w-3.5 h-3.5" />}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {qualityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.shortLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Format Select */}
      <Select
        value={settings.format}
        onValueChange={onFormatChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className="w-[75px] sm:w-[80px] h-9 text-xs bg-card/50 border-border/50"
          title="Output format"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {formatOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Playlist Toggle */}
      <button
        onClick={onPlaylistToggle}
        disabled={disabled}
        title={settings.downloadPlaylist ? "Playlist mode ON - will download all videos" : "Playlist mode OFF - single video only"}
        className={cn(
          "h-9 px-2.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors",
          settings.downloadPlaylist 
            ? "bg-primary/10 border-primary/30 text-primary" 
            : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground"
        )}
      >
        <ListVideo className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Playlist</span>
      </button>

      {/* Advanced Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-2.5 gap-1.5" 
            disabled={disabled}
            title="Advanced settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">More</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Advanced Settings</h4>
              {fileSizeDisplay && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <HardDrive className="w-3 h-3" />
                  {fileSizeDisplay}
                </Badge>
              )}
            </div>

            {/* Video Codec */}
            {!isAudioOnly && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  Video Codec
                </Label>
                <Select
                  value={settings.videoCodec}
                  onValueChange={onVideoCodecChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoCodecOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <span>{opt.label}</span>
                        <span className="text-muted-foreground ml-1">({opt.desc})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Audio Bitrate */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Audio Bitrate
              </Label>
              <Select
                value={settings.audioBitrate}
                onValueChange={onAudioBitrateChange}
                disabled={disabled}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audioBitrateOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Playlist Toggle in Popover */}
            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">Download Playlist</p>
                  <p className="text-[10px] text-muted-foreground">Get all videos</p>
                </div>
              </div>
              <Switch
                checked={settings.downloadPlaylist}
                onCheckedChange={onPlaylistToggle}
                disabled={disabled}
              />
            </div>

            {/* Output Folder */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Output Folder</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.outputPath}
                  readOnly
                  className="flex-1 font-mono text-[10px] h-9"
                  placeholder="Select folder..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSelectFolder}
                  disabled={disabled}
                  className="h-9 px-2.5"
                  title="Browse for folder"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Output Folder Button - Quick Access */}
      <button
        onClick={onSelectFolder}
        disabled={disabled}
        className="h-9 px-2.5 rounded-md border bg-card/50 border-border/50 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors max-w-[140px]"
        title={`Output folder: ${settings.outputPath || 'Not selected'}`}
      >
        <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate hidden xs:inline">{outputFolderName}</span>
      </button>

      {/* File Size Estimate Badge */}
      {fileSizeDisplay && (
        <Badge 
          variant="outline" 
          className="h-9 px-2.5 text-xs gap-1.5 hidden sm:flex"
          title="Estimated file size"
        >
          <HardDrive className="w-3.5 h-3.5" />
          {fileSizeDisplay}
        </Badge>
      )}
    </div>
  );
}
