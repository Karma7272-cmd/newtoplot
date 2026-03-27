import React, { useRef, useEffect, useState } from "react";
import { initPoseLandmarker } from "../services/visionService";
import { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { Camera, CameraOff, Loader2, Download, Circle, FileVideo, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVideoExport } from "../hooks/useVideoExport";

const HumanSensing: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const requestRef = useRef<number>(0);
  
  // History for movement visualization
  const historyRef = useRef<PoseLandmarkerResult[]>([]);
  const MAX_HISTORY = 10;

  const { exportVideo, isExporting, exportProgress } = useVideoExport();

  useEffect(() => {
    const setup = async () => {
      setIsLoading(true);
      try {
        const p = await initPoseLandmarker();
        setLandmarker(p);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to init landmarker:", err);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      
      // Cleanup camera tracks on unmount
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [downloadUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          setDimensions({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });
          videoRef.current.play();
          setIsCameraOn(true);
          requestRef.current = requestAnimationFrame(predictWebcam);
        };
      } else {
        // Cleanup if component unmounted
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (isRecording) stopRecording();
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    cancelAnimationFrame(requestRef.current);
    historyRef.current = [];
  };

  const drawPose = (ctx: CanvasRenderingContext2D, result: PoseLandmarkerResult, opacity: number, color: string) => {
    if (!result.landmarks || result.landmarks.length === 0) return;

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillStyle = color;

    result.landmarks.forEach((landmarks) => {
      // Draw connections
      PoseLandmarker.POSE_CONNECTIONS.forEach((connection) => {
        const start = landmarks[connection.start];
        const end = landmarks[connection.end];
        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(start.x * dimensions.width, start.y * dimensions.height);
          ctx.lineTo(end.x * dimensions.width, end.y * dimensions.height);
          ctx.stroke();
        }
      });

      // Draw landmarks
      landmarks.forEach((landmark) => {
        if (landmark.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(landmark.x * dimensions.width, landmark.y * dimensions.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    });
    ctx.globalAlpha = 1.0;
  };

  const predictWebcam = () => {
    if (videoRef.current && landmarker && videoRef.current.readyState >= 2 && canvasRef.current) {
      const startTimeMs = performance.now();
      const results = landmarker.detectForVideo(videoRef.current, startTimeMs);
      
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        ctx.drawImage(videoRef.current, 0, 0, dimensions.width, dimensions.height);

        // Update history
        if (results.landmarks && results.landmarks.length > 0) {
          historyRef.current.push(results);
          if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
          }
        }

        // Visualize movement (history)
        historyRef.current.forEach((prevResult, index) => {
          const opacity = (index + 1) / (MAX_HISTORY + 1) * 0.3;
          drawPose(ctx, prevResult, opacity, "#3b82f6");
        });

        // Draw current pose
        drawPose(ctx, results, 1.0, "#60a5fa");

        // Add movement indicators
        if (historyRef.current.length > 1) {
          const current = results.landmarks[0];
          const previous = historyRef.current[historyRef.current.length - 2].landmarks[0];
          
          if (current && previous) {
            // Check movement of nose (index 0)
            const dx = Math.abs(current[0].x - previous[0].x);
            const dy = Math.abs(current[0].y - previous[0].y);
            const movement = Math.sqrt(dx * dx + dy * dy);
            
            if (movement > 0.01) {
              ctx.fillStyle = "#ef4444";
              ctx.font = "bold 20px sans-serif";
              ctx.fillText("MOVEMENT DETECTED", 30, 50);
              
              // Draw movement vector on nose
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(previous[0].x * dimensions.width, previous[0].y * dimensions.height);
              ctx.lineTo(current[0].x * dimensions.width, current[0].y * dimensions.height);
              ctx.stroke();
            }
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
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

  const handleExportMp4 = async () => {
    if (recordedBlob) {
      await exportVideo(recordedBlob, `newtoplot-sensing-${Date.now()}.mp4`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-[var(--glass)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-[var(--glass-border)]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-0"
          playsInline
          muted
        />
        
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <AnimatePresence>
          {!isCameraOn && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)]/90 backdrop-blur-md z-20"
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full animate-pulse" />
                    <Loader2 className="w-14 h-14 text-red-600 animate-spin relative z-10" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[var(--fg)] font-display font-bold text-lg tracking-tight">Initializing Human Sensing</p>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Loading Pose Landmarker</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="p-8 rounded-[32px] bg-[var(--glass)] border border-[var(--glass-border)] shadow-inner">
                    <Activity className="w-14 h-14 text-gray-400" />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-gray-400 font-display font-bold text-lg tracking-tight">Sensing Standby</p>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Human Presence</p>
                  </div>
                </div>
              )}
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
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Optimizing Movement Data</p>
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
          <div className="absolute top-6 right-6 flex items-center gap-2.5 px-4 py-2 bg-emerald-600/90 backdrop-blur-xl rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-2xl z-50">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Sensing Active
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            disabled={isLoading}
            title="Start Sensing"
            className="flex items-center justify-center w-16 h-16 bg-black hover:bg-gray-900 disabled:opacity-50 text-white rounded-[24px] font-bold transition-all shadow-2xl shadow-black/10 active:scale-[0.98]"
          >
            <Camera className="w-6 h-6" />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={stopCamera}
              title="Terminate Sensing"
              className="flex items-center justify-center w-14 h-14 bg-[var(--glass)] hover:bg-red-500/10 text-red-600 rounded-[20px] font-bold transition-all border border-[var(--glass-border)] active:scale-[0.98]"
            >
              <CameraOff className="w-6 h-6" />
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                title="Record Movement"
                className="flex items-center justify-center w-14 h-14 bg-black hover:bg-gray-900 text-white rounded-[20px] font-bold transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                <Circle className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                title="Stop Recording"
                className="flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-[20px] font-bold transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]"
              >
                <Circle className="w-6 h-6 fill-current" />
              </button>
            )}
          </div>
        )}

        {downloadUrl && (
          <div className="flex gap-3">
            <a
              href={downloadUrl}
              download="human-sensing.webm"
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
    </div>
  );
};

export default HumanSensing;
