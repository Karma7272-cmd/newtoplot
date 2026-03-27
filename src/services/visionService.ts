import { ObjectDetector, FilesetResolver, Detection, PoseLandmarker } from "@mediapipe/tasks-vision";

let objectDetector: ObjectDetector | null = null;
let poseLandmarker: PoseLandmarker | null = null;
let currentModelPath: string | null = null;

export const initObjectDetector = async (modelPath: string, forceReinit = false) => {
  if (objectDetector && currentModelPath === modelPath && !forceReinit) {
    return objectDetector;
  }

  // Close existing detector if it exists
  if (objectDetector) {
    objectDetector.close();
    objectDetector = null;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: modelPath,
      delegate: "GPU"
    },
    scoreThreshold: 0.5,
    runningMode: "VIDEO"
  });

  currentModelPath = modelPath;
  return objectDetector;
};

export const initPoseLandmarker = async () => {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 2
  });

  return poseLandmarker;
};

export const detectObjects = (image: HTMLVideoElement | HTMLImageElement, timestamp: number) => {
  if (!objectDetector) return [];
  const result = objectDetector.detectForVideo(image, timestamp);
  return result.detections;
};

export type { Detection };
