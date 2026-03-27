import React, { useState, useEffect } from "react";
import LiveDetection from "./components/LiveDetection";
import VideoAnalysis from "./components/VideoAnalysis";
import HumanSensing from "./components/HumanSensing";
import ModelSelector from "./components/ModelSelector";
import { AVAILABLE_MODELS, ModelOption } from "./constants";
import { ScanSearch, Video, Info, Sparkles, Settings2, Activity, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Mode = "live" | "video" | "sensing";

export default function App() {
  const [mode, setMode] = useState<Mode>("live");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] overflow-x-hidden selection:bg-red-500/30 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="w-full pt-6 md:pt-12 pb-4 md:pb-8 px-4 md:px-6 flex flex-col items-center gap-4 md:gap-6 relative">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <button
            onClick={toggleTheme}
            className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-[var(--glass)] border border-[var(--glass-border)] hover:bg-red-600/10 transition-all active:scale-95 group"
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-600 group-hover:text-red-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 md:w-5 md:h-5 text-yellow-400 group-hover:text-red-600" />
            )}
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 md:gap-4"
        >
          <div className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-red-600 shadow-2xl shadow-red-600/40">
            <ScanSearch className="w-6 h-6 md:w-9 md:h-9 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-5xl font-display font-black tracking-tight uppercase italic leading-none">
              newto<span className="text-red-600">plot</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
              <div className="h-px w-4 md:w-8 bg-red-500/50" />
              <p className="text-gray-400 text-[7px] md:text-[10px] font-black tracking-[0.15em] md:tracking-[0.3em] uppercase">
                Neural Intelligence
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Dashboard Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-6 pb-8 md:pb-24 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 md:gap-8">
        
        {/* Sidebar Controls */}
        <aside className="flex flex-col gap-4 md:gap-6 order-2 lg:order-1">
          <section className="bg-red-600 rounded-[20px] md:rounded-3xl p-4 md:p-6 flex flex-col gap-4 md:gap-6 relative z-20 shadow-xl shadow-red-600/20">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-white/20">
                <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-white">Configuration</h2>
            </div>
            
            <div className="space-y-2 md:space-y-4">
              <label className="text-[8px] md:text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">
                Detection Engine
              </label>
              <ModelSelector 
                selectedModelId={selectedModel.id} 
                onModelChange={setSelectedModel} 
              />
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="space-y-2 md:space-y-4">
              <label className="text-[8px] md:text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">
                Analysis Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMode("live")}
                  title="Live Stream"
                  className={`flex items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border ${
                    mode === "live" 
                      ? "bg-black border-black text-white shadow-lg shadow-black/20" 
                      : "bg-black/20 border-black/5 text-white/70 hover:text-white hover:bg-black/30"
                  }`}
                >
                  <ScanSearch className="w-4.5 h-4.5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={() => setMode("video")}
                  title="File Analysis"
                  className={`flex items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border ${
                    mode === "video" 
                      ? "bg-black border-black text-white shadow-lg shadow-black/20" 
                      : "bg-black/20 border-black/5 text-white/70 hover:text-white hover:bg-black/30"
                  }`}
                >
                  <Video className="w-4.5 h-4.5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={() => setMode("sensing")}
                  title="Human Sensing"
                  className={`flex items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border ${
                    mode === "sensing" 
                      ? "bg-black border-black text-white shadow-lg shadow-black/20" 
                      : "bg-black/20 border-black/5 text-white/70 hover:text-white hover:bg-black/30"
                  }`}
                >
                  <Activity className="w-4.5 h-4.5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
          </section>

          {/* Video Settings in Sidebar */}
          <AnimatePresence>
            {mode === "video" && (
              <motion.section
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-black rounded-[20px] md:rounded-3xl p-4 md:p-6 flex flex-col gap-4 md:gap-6 relative z-10 shadow-xl shadow-black/20 overflow-hidden"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/10">
                    <Video className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-white leading-none">Video Settings</h2>
                    <p className="text-[7px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Playback Control</p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col gap-2 md:gap-3">
                    <span className="text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Analysis Speed</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.3, 0.6, 0.9, 1, 1.3, 1.6, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-1 py-1.5 md:px-2 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-mono font-bold transition-all border ${
                            playbackSpeed === speed
                              ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                              : "bg-white/5 border-white/10 text-white/70 hover:border-red-600/50"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-2 md:gap-3">
                      <span className="text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Dimensions</span>
                      <div className="flex flex-col gap-0.5 md:gap-1 ml-1">
                        <p className="text-white font-mono text-[10px] md:text-xs font-bold">
                          {videoDimensions.width} × {videoDimensions.height}
                        </p>
                        <p className="text-white/30 text-[7px] md:text-[8px] uppercase tracking-wider font-bold">Native Resolution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </aside>

        {/* Main Viewport */}
        <div className="order-1 lg:order-2 min-h-[250px] md:min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full"
            >
              {mode === "live" ? (
                <LiveDetection modelPath={selectedModel.path} />
              ) : mode === "video" ? (
                <VideoAnalysis 
                  modelPath={selectedModel.path} 
                  playbackSpeed={playbackSpeed}
                  onDimensionsChange={setVideoDimensions}
                />
              ) : (
                <HumanSensing />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 md:py-12 px-4 md:px-6 border-t border-[var(--glass-border)] bg-[var(--glass)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
          <div className="flex flex-col gap-1.5 md:gap-2 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <ScanSearch className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              <span className="font-display font-bold text-base md:text-lg tracking-tight uppercase italic text-[var(--fg)]">
                newto<span className="text-red-600">plot</span>
              </span>
            </div>
            <p className="text-gray-500 text-[9px] md:text-xs max-w-[280px] md:max-w-sm">
              Professional-grade computer vision platform for real-time object recognition and automated video intelligence.
            </p>
          </div>
          
          <div className="flex gap-6 md:gap-12">
            <div className="flex flex-col gap-1.5 md:gap-3">
              <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Engine</span>
              <span className="text-[9px] md:text-xs text-gray-500 hover:text-[var(--fg)] transition-colors cursor-pointer">MediaPipe</span>
              <span className="text-[9px] md:text-xs text-gray-500 hover:text-[var(--fg)] transition-colors cursor-pointer">TFLite</span>
            </div>
            <div className="flex flex-col gap-1.5 md:gap-3">
              <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</span>
              <span className="text-[9px] md:text-xs text-gray-500 hover:text-[var(--fg)] transition-colors cursor-pointer">WebGPU</span>
              <span className="text-[9px] md:text-xs text-gray-500 hover:text-[var(--fg)] transition-colors cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
