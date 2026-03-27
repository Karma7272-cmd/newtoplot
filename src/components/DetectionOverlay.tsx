import React from "react";
import { Detection } from "@mediapipe/tasks-vision";

interface DetectionOverlayProps {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
}) => {
  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {detections.map((detection, index) => {
        const { originX, originY, width, height } = detection.boundingBox!;
        const label = detection.categories[0]?.categoryName || "Unknown";
        const score = Math.round((detection.categories[0]?.score || 0) * 100);

        return (
          <div
            key={`${label}-${index}`}
            className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm"
            style={{
              left: `${originX * scaleX}px`,
              top: `${originY * scaleY}px`,
              width: `${width * scaleX}px`,
              height: `${height * scaleY}px`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t font-bold uppercase tracking-wider">
              {label} {score}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DetectionOverlay;
