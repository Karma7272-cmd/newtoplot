import React from "react";
import { AVAILABLE_MODELS, ModelOption } from "../constants";
import { ChevronDown, Zap, Target, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (model: ModelOption) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onModelChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <div className="relative w-full">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20 active:scale-[0.98]"
        }`}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[8px] md:text-[10px] font-black text-white/70 uppercase tracking-widest">Active Engine</span>
          <span className="text-xs md:text-sm font-bold text-white tracking-tight">{selectedModel.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-white/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg)] border border-[var(--glass-border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-40 overflow-hidden"
            >
              <div className="p-1.5 flex flex-col gap-1">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col gap-1.5 p-4 rounded-xl transition-all text-left ${
                      selectedModelId === model.id 
                        ? "bg-red-500/10 border border-red-500/20" 
                        : "hover:bg-[var(--glass)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold tracking-tight ${selectedModelId === model.id ? "text-red-600" : "text-[var(--fg)]"}`}>
                        {model.name}
                      </span>
                      <div className="flex gap-1.5">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-black text-red-600 uppercase tracking-wider">
                          <Target className="w-2.5 h-2.5" />
                          {model.accuracy}
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                          <Zap className="w-2.5 h-2.5" />
                          {model.speed}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {model.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
