import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { cn } from '@/lib/utils';
import { useProcessing } from '@/contexts/ProcessingContext';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Film,
  Zap,
  FileDown,
  Send,
  Wand2,
  X,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  History,
  FolderOpen,
  Maximize2,
  Lightbulb,
  FileVideo,
  Terminal,
  MessageSquare,
  Calendar,
  Trash2,
  Copy,
} from 'lucide-react';
import type { TimelineSelection, VideoMetadata, ProcessingProgress, ProcessingJob } from '@/lib/types';

// Memoized Video Player to prevent unnecessary re-renders
interface VideoPlayerProps {
  videoSrc: string | null;
  videoPath: string | null;
  metadata: VideoMetadata | null;
  isLoadingVideo: boolean;
  isGeneratingPreview: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  selection: TimelineSelection | null;
  onSelectVideo: () => void;
  onCancelProcessing: () => void;
}

const VideoPlayer = memo(function VideoPlayer({
  videoSrc,
  videoPath,
  metadata,
  isLoadingVideo,
  isGeneratingPreview,
  isProcessing,
  progress,
  selection,
  onSelectVideo,
  onCancelProcessing,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 2.5 seconds of no interaction
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowControls(true);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  }, [isPlaying]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    } else {
      resetHideTimer();
    }
  }, [isPlaying, resetHideTimer]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoAspectRatio = metadata ? metadata.width / metadata.height : 16 / 9;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden w-full",
        "bg-black",
        !videoSrc && "aspect-video flex items-center justify-center border border-white/10",
        videoSrc && !showControls && "cursor-none"
      )}
      style={videoSrc ? { 
        aspectRatio: videoAspectRatio,
        maxHeight: '70vh'
      } : undefined}
      onMouseMove={resetHideTimer}
      onMouseEnter={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoadingVideo || isGeneratingPreview ? (
        <div className="flex flex-col items-center gap-3 text-white/70">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm">{isGeneratingPreview ? 'Generating preview...' : 'Loading...'}</p>
        </div>
      ) : videoSrc ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />

          {/* Top bar with video title */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 p-3 pb-8",
              "bg-gradient-to-b from-black/70 to-transparent",
              "transition-opacity duration-300 flex items-start justify-between",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            {videoPath && (
              <>
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-white truncate">
                    {videoPath.split('/').pop()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-white/70 hover:text-white hover:bg-white/20 flex-shrink-0"
                  onClick={onSelectVideo}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Change
                </Button>
              </>
            )}
          </div>

          {/* Video Controls Overlay */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 p-3 pt-12",
              "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
              "transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Timeline */}
            <div className="relative mb-3">
              {/* Selection range */}
              {selection && duration > 0 && (
                <div
                  className="absolute h-1 bg-primary/50 rounded top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{
                    left: `${(selection.start / duration) * 100}%`,
                    width: `${((selection.end - selection.start) / duration) * 100}%`,
                  }}
                />
              )}
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              {/* Skip */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white"
                onClick={() => handleSeek([currentTime - 10])}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white"
                onClick={() => handleSeek([currentTime + 10])}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              {/* Time */}
              <span className="text-xs text-white/70 font-mono min-w-[80px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Volume */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white"
                  onClick={handleToggleMute}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Processing Overlay */}
          {isProcessing && progress && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="text-center text-white">
                <p className="font-medium">{progress.percent.toFixed(0)}%</p>
                <p className="text-xs text-white/60">{progress.speed}</p>
              </div>
              <Progress value={progress.percent} className="w-48" />
              <Button variant="destructive" size="sm" onClick={onCancelProcessing}>
                Cancel
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Film className="w-8 h-8 opacity-50" />
          </div>
          <div className="text-center">
            <p className="font-medium">No video loaded</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Select a video to start editing</p>
          </div>
          <Button onClick={onSelectVideo} className="mt-2">
            <Upload className="w-4 h-4 mr-2" />
            Select Video
          </Button>
        </div>
      )}
    </div>
  );
});

// History Dialog Component
interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: ProcessingJob[];
  onDelete: (id: string) => void;
}

function HistoryDialog({ open, onOpenChange, history, onDelete }: HistoryDialogProps) {
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCommand = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Processing History
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Job List */}
          <div className="w-80 border-r flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <History className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">No processing history</p>
                  </div>
                ) : (
                  history.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        "hover:bg-muted/50",
                        selectedJob?.id === job.id && "bg-muted"
                      )}
                    >
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium break-all">
                          {job.input_path.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(job.created_at)}
                        </p>
                        {job.user_prompt && (
                          <p className="text-xs text-muted-foreground/70 mt-1 break-all line-clamp-3">
                            "{job.user_prompt}"
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Job Details */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {selectedJob ? (
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg break-words">
                        {selectedJob.input_path.split('/').pop()}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getStatusBadge(selectedJob.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedJob.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedJob.status === 'completed' && selectedJob.output_path && (
                        <Button
                          size="sm"
                          onClick={() => revealItemInDir(selectedJob.output_path!)}
                          className="gap-1.5"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open Folder
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => {
                          onDelete(selectedJob.id);
                          setSelectedJob(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* User Prompt */}
                  {selectedJob.user_prompt && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Prompt
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-sm break-words whitespace-pre-wrap">{selectedJob.user_prompt}</p>
                      </div>
                    </div>
                  )}

                  {/* Input/Output Files */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileVideo className="w-4 h-4 text-blue-500" />
                        Input
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border overflow-hidden">
                        <p className="text-xs text-muted-foreground break-all">
                          {selectedJob.input_path}
                        </p>
                      </div>
                    </div>
                    {selectedJob.output_path && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileDown className="w-4 h-4 text-green-500" />
                          Output
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border overflow-hidden">
                          <p className="text-xs text-muted-foreground break-all">
                            {selectedJob.output_path}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FFmpeg Command */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Terminal className="w-4 h-4 text-orange-500" />
                        FFmpeg Command
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => copyCommand(selectedJob.ffmpeg_command)}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto">
                      <code className="text-xs text-zinc-300 break-all whitespace-pre-wrap font-mono block">
                        {selectedJob.ffmpeg_command}
                      </code>
                    </div>
                  </div>

                  {/* Error Message */}
                  {selectedJob.error_message && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        Error
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-500 break-words whitespace-pre-wrap">{selectedJob.error_message}</p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Created: {formatDate(selectedJob.created_at)}
                    </div>
                    {selectedJob.completed_at && (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Completed: {formatDate(selectedJob.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileVideo className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Prompt suggestions for chat
const promptSuggestions = [
  { id: 'cut', label: 'Cut', prompt: 'Cut video from [start_time] to [end_time]' },
  { id: 'extract_audio', label: 'Extract Audio', prompt: 'Extract audio as [mp3/m4a/wav]' },
  { id: 'resize', label: 'Resize', prompt: 'Resize to [720p/1080p/480p]' },
  { id: 'convert', label: 'Convert', prompt: 'Convert to [mp4/webm/mkv/mov]' },
  { id: 'compress', label: 'Compress', prompt: 'Compress video to reduce file size' },
  { id: 'speed', label: 'Speed', prompt: 'Change speed to [0.5x/1.5x/2x]' },
  { id: 'gif', label: 'GIF', prompt: 'Create GIF from [start_time] to [end_time]' },
  { id: 'rotate', label: 'Rotate', prompt: 'Rotate video [90/180/270] degrees' },
  { id: 'thumbnail', label: 'Thumbnail', prompt: 'Extract thumbnail at [time]' },
  { id: 'remove_audio', label: 'Mute', prompt: 'Remove audio from video' },
];

export function ProcessingPage() {
  // Get state and actions from context (persistent across navigation)
  const {
    videoPath,
    videoSrc,
    videoMetadata: metadata,
    isLoadingVideo,
    isGeneratingPreview,
    selection,
    isProcessing,
    progress,
    messages,
    isGenerating,
    history,
    selectVideo,
    sendMessage,
    cancelProcessing,
    loadHistory,
    deleteJob,
  } = useProcessing();

  // Chat UI state (local, OK to reset)
  const [inputMessage, setInputMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // History dialog
  const [showHistory, setShowHistory] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, isProcessing]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSelectSuggestion = (prompt: string) => {
    setInputMessage(prompt);
    setShowSuggestions(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !metadata || !videoPath) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // sendMessage handles: adding user message, generating command, and auto-executing
    await sendMessage(message);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between h-12 sm:h-14 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold">Processing</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {history.length}
                </Badge>
              )}
            </Button>
            <ThemePicker />
          </div>
        </header>

        <div className="mx-4 sm:mx-6 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Video + Controls */}
          <div className="w-[70%] flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
            {/* Memoized Video Player - prevents re-renders from chat/processing state changes */}
            <VideoPlayer
              videoSrc={videoSrc}
              videoPath={videoPath}
              metadata={metadata}
              isLoadingVideo={isLoadingVideo}
              isGeneratingPreview={isGeneratingPreview}
              isProcessing={isProcessing}
              progress={progress}
              selection={selection}
              onSelectVideo={selectVideo}
              onCancelProcessing={cancelProcessing}
            />

            {/* Metadata Bar */}
            {metadata && (
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                      <Maximize2 className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{metadata.width}×{metadata.height}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                      <Film className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{metadata.video_codec}</span>
                  </div>
                  {metadata.audio_codec && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                        <Music className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{metadata.audio_codec}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{formatTime(metadata.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                      <FileDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{(metadata.file_size / 1_000_000).toFixed(1)} MB</span>
                  </div>
                  {metadata.frame_rate && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{metadata.frame_rate.toFixed(0)} fps</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat Panel */}
          <div className="w-[30%] border-l border-border flex flex-col bg-gradient-to-b from-muted/30 to-background overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Describe your edit</p>
                  </div>
                </div>
                
                {/* Suggestions Button */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        disabled={!metadata || isProcessing || isGenerating}
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          "transition-all duration-200",
                          "hover:bg-muted text-muted-foreground hover:text-foreground",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          showSuggestions && "bg-muted text-foreground"
                        )}
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Prompt Templates</TooltipContent>
                  </Tooltip>
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && (
                    <div className={cn(
                      "absolute top-full right-0 mt-2 w-64",
                      "bg-background/95 backdrop-blur-xl",
                      "border border-border/50 rounded-xl shadow-xl",
                      "p-2 z-50"
                    )}>
                      <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
                        Prompt Templates
                      </div>
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        {promptSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSelectSuggestion(suggestion.prompt)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg",
                              "text-sm transition-colors",
                              "hover:bg-muted/70 text-foreground"
                            )}
                          >
                            <div className="font-medium">{suggestion.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.prompt}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3">
                      <Wand2 className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">What would you like to do?</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-[180px]">
                      Try "Cut from 1:00 to 2:00" or "Convert to 720p"
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.role === 'user' && "justify-end",
                        msg.role === 'assistant' && "justify-start",
                        msg.role === 'system' && "justify-center",
                        msg.role === 'complete' && "justify-center"
                      )}
                    >
                      {msg.role === 'complete' ? (
                        // Complete message with Open Folder button
                        <div className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <span className="text-xs text-muted-foreground max-w-[120px] truncate">{msg.content}</span>
                          <button
                            className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline flex-shrink-0"
                            onClick={() => msg.outputPath && revealItemInDir(msg.outputPath)}
                          >
                            <FolderOpen className="w-3 h-3" />
                            Open
                          </button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
                            "max-w-[85%]",
                            msg.role === 'user' && "p-3 bg-primary text-primary-foreground rounded-br-sm",
                            msg.role === 'assistant' && "p-3 bg-muted/80 border border-border/50 rounded-bl-sm",
                            msg.role === 'system' && "text-xs text-muted-foreground py-1 px-3 bg-muted/30 rounded-full"
                          )}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
                              <Wand2 className="w-3 h-3" />
                              <span>AI</span>
                            </div>
                          )}
                          <p className={cn(
                            "whitespace-pre-wrap [overflow-wrap:anywhere]",
                            msg.role === 'system' && "italic"
                          )}>{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {(isGenerating || isProcessing) && (
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground text-sm py-2 px-4 bg-muted/50 rounded-full">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>{isProcessing ? 'Processing...' : 'Generating...'}</span>
                    </div>
                  </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Floating Input - Modern glass style */}
            <div className="flex-shrink-0 p-3 pt-0">
              <div 
                className={cn(
                  "relative flex items-end gap-2 p-2 rounded-2xl",
                  "bg-background/60 backdrop-blur-md",
                  "transition-all duration-300 ease-out",
                  // Default state
                  !isInputFocused && [
                    "ring-1 ring-white/10 dark:ring-white/5",
                    "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]",
                    "hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4)]"
                  ],
                  // Focused state - takes priority
                  isInputFocused && [
                    "ring-2 ring-primary/30",
                    "shadow-[0_0_0_4px_hsl(var(--primary)/0.1),0_8px_32px_-4px_rgba(0,0,0,0.15)]"
                  ]
                )}
              >
                {/* Subtle gradient overlay */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
                  isInputFocused 
                    ? "bg-gradient-to-b from-primary/5 to-transparent opacity-100" 
                    : "bg-gradient-to-b from-white/5 to-transparent opacity-100"
                )} />
                
                <div className="relative flex-1 min-w-0">
                  <textarea
                    placeholder="Describe your edit..."
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!metadata || isProcessing || isGenerating}
                    rows={1}
                    className={cn(
                      "w-full resize-none bg-transparent border-0 outline-none",
                      "text-sm leading-relaxed py-2 px-3",
                      "placeholder:text-muted-foreground/40",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "max-h-[120px]"
                    )}
                    style={{ height: 'auto', minHeight: '40px' }}
                  />
                </div>
                
                <button
                  className={cn(
                    "relative flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
                    "transition-all duration-300 ease-out",
                    inputMessage.trim() && metadata && !isProcessing && !isGenerating
                      ? "btn-gradient shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                      : "bg-muted/50 text-muted-foreground/30 hover:bg-muted/70 hover:text-muted-foreground/50"
                  )}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !metadata || isProcessing || isGenerating}
                >
                  <Send className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    inputMessage.trim() && "-rotate-45"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Dialog */}
        <HistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          history={history}
          onDelete={deleteJob}
        />
      </div>
    </TooltipProvider>
  );
}
