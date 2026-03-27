import React, { useRef, useState, useEffect } from "react";
import { initObjectDetector } from "../services/visionService";
import { Detection, ObjectDetector } from "@mediapipe/tasks-vision";
import DetectionOverlay from "./DetectionOverlay";
import { Upload, Play, Pause, RotateCcw, Loader2, FileVideo, Download, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVideoExport } from "../hooks/useVideoExport";

interface VideoAnalysisProps {
  modelPath: string;
  playbackSpeed: number;
  onDimensionsChange: (dims: { width: number; height: number }) => void;
}

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({ 
  modelPath, 
  playbackSpeed,
  onDimensionsChange 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<ObjectDetector | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const requestRef = useRef<number>(0);

  const { exportVideo, isExporting, exportProgress } = useVideoExport();

  useEffect(() => {
    const setup = async () => {
      setIsLoading(true);
      try {
        const d = await initObjectDetector(modelPath);
        setDetector(d);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to init detector:", err);
      }
    };
    setup();
  }, [modelPath]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setDetections([]);
      setIsPlaying(false);
      setDownloadUrl(null);
      setRecordedChunks([]);
      setRecordedBlob(null);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(requestRef.current);
    } else {
      videoRef.current.play();
      requestRef.current = requestAnimationFrame(processFrame);
    }
    setIsPlaying(!isPlaying);
  };

  const resetVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.pause();
    setIsPlaying(false);
    setDetections([]);
    cancelAnimationFrame(requestRef.current);
  };

  const processFrame = () => {
    if (videoRef.current && detector && !videoRef.current.paused && !videoRef.current.ended) {
      const startTimeMs = performance.now();
      const results = detector.detectForVideo(videoRef.current, startTimeMs);
      setDetections(results.detections);

      // Draw to hidden canvas if recording
      if (isRecording && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, dimensions.width, dimensions.height);
          
          // Draw bounding boxes
          results.detections.forEach(detection => {
            const { originX, originY, width, height } = detection.boundingBox!;
            const label = detection.categories[0]?.categoryName || "Unknown";
            const score = Math.round((detection.categories[0]?.score || 0) * 100);

            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 4;
            ctx.strokeRect(originX, originY, width, height);

            ctx.fillStyle = "#3b82f6";
            ctx.font = "bold 16px sans-serif";
            const text = `${label} ${score}%`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(originX, originY - 25, textWidth + 10, 25);
            ctx.fillStyle = "white";
            ctx.fillText(text, originX + 5, originY - 7);
          });
        }
      }

      requestRef.current = requestAnimationFrame(processFrame);
    } else if (videoRef.current?.ended) {
      setIsPlaying(false);
      if (isRecording) stopRecording();
      cancelAnimationFrame(requestRef.current);
    }
  };

  const startRecording = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setRecordedChunks([]);
    setDownloadUrl(null);
    setRecordedBlob(null);
    
    const stream = canvasRef.current.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
    setIsRecording(true);
    
    // Ensure video is playing
    if (videoRef.current.paused) {
      togglePlay();
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRecordedBlob(blob);
    }
  }, [isRecording, recordedChunks]);

  const onMetadataLoaded = () => {
    if (videoRef.current) {
      const newDims = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      setDimensions(newDims);
      onDimensionsChange(newDims);
    }
  };

  const handleExportMp4 = async () => {
    if (recordedBlob) {
      await exportVideo(recordedBlob, `newtoplot-analysis-${Date.now()}.mp4`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-[var(--glass)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-[var(--glass-border)]">
        {videoFile ? (
          <>
            <video
              ref={videoRef}
              src={videoFile}
              className="w-full h-full object-cover"
              onLoadedMetadata={onMetadataLoaded}
              onEnded={() => setIsPlaying(false)}
            />
            {/* Hidden canvas for recording */}
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="hidden"
            />
            {dimensions.width > 0 && (
              <DetectionOverlay
                detections={detections}
                videoWidth={dimensions.width}
                videoHeight={dimensions.height}
                containerWidth={videoRef.current?.clientWidth || 0}
                containerHeight={videoRef.current?.clientHeight || 0}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/90 backdrop-blur-md z-20">
            <div className="flex flex-col items-center gap-6">
              <div className="p-8 rounded-[32px] bg-[var(--glass)] border border-[var(--glass-border)] shadow-inner">
                <Upload className="w-14 h-14 text-gray-400" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-gray-400 font-display font-bold text-lg tracking-tight">Media Vault</p>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Upload Video for Neural Analysis</p>
              </div>
              <label className="mt-4 px-10 py-5 bg-black hover:bg-gray-900 text-white rounded-[24px] font-bold transition-all shadow-2xl shadow-black/10 active:scale-[0.98] cursor-pointer">
                Select File
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/60 backdrop-blur-sm z-30"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="w-14 h-14 text-red-600 animate-spin relative z-10" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[var(--fg)] font-display font-bold text-lg tracking-tight">Analyzing Frames</p>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Neural Network Active</p>
                </div>
              </div>
            </motion.div>
          )}

          {isExporting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/95 backdrop-blur-xl z-[60]"
            >
              <div className="flex flex-col items-center gap-8 w-full max-w-xs">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full animate-pulse" />
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--glass-border)] flex items-center justify-center relative z-10">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"
                      style={{ animationDuration: '2s' }}
                    />
                    <span className="text-[var(--fg)] font-mono font-bold text-xl">{exportProgress}%</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-[var(--fg)] font-display font-bold text-xl tracking-tight">Encoding MP4</p>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Optimizing for High Quality</p>
                </div>
                <div className="w-full h-1.5 bg-[var(--glass)] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isRecording && (
          <div className="absolute top-6 right-6 flex items-center gap-2.5 px-4 py-2 bg-red-600/90 backdrop-blur-xl rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-2xl z-50">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Analysis Recording
          </div>
        )}
      </div>

      {videoFile && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex gap-3">
            <button
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Analyze"}
              className="flex items-center justify-center w-14 h-14 bg-black hover:bg-gray-900 text-white rounded-[20px] font-bold transition-all shadow-xl shadow-black/10 active:scale-[0.98]"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button
              onClick={resetVideo}
              title="Reset"
              className="flex items-center justify-center w-14 h-14 bg-[var(--glass)] hover:bg-[var(--glass-border)] text-[var(--fg)] rounded-[20px] font-bold transition-all border border-[var(--glass-border)] active:scale-[0.98]"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                title="Capture Analysis"
                className="flex items-center justify-center w-14 h-14 bg-black hover:bg-gray-900 text-white rounded-[20px] font-bold transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                <Circle className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                title="Stop Capture"
                className="flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-[20px] font-bold transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]"
              >
                <Circle className="w-6 h-6 fill-current" />
              </button>
            )}
          </div>

          <label 
            title="Switch Video"
            className="flex items-center justify-center w-14 h-14 bg-[var(--glass)] hover:bg-[var(--glass-border)] text-[var(--fg)] rounded-[20px] font-bold transition-all border border-[var(--glass-border)] active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-6 h-6" />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {downloadUrl && (
            <div className="flex gap-3">
              <a
                href={downloadUrl}
                download="video-analysis.webm"
                title="Download WebM"
                className="flex items-center justify-center w-14 h-14 bg-[var(--glass)] hover:bg-[var(--glass-border)] text-[var(--fg)] rounded-[20px] font-bold transition-all border border-[var(--glass-border)] active:scale-[0.98]"
              >
                <Download className="w-6 h-6" />
              </a>
              <button
                onClick={handleExportMp4}
                disabled={isExporting}
                title="Export MP4"
                className="flex items-center justify-center w-14 h-14 bg-black hover:bg-gray-900 text-white rounded-[20px] font-bold transition-all shadow-2xl shadow-black/10 active:scale-[0.98] disabled:opacity-50"
              >
                <FileVideo className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoAnalysis;
