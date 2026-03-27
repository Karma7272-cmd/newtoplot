export interface ModelOption {
  id: string;
  name: string;
  description: string;
  path: string;
  accuracy: "Low" | "Medium" | "High";
  speed: "Fastest" | "Fast" | "Moderate";
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "efficientdet_lite0",
    name: "EfficientDet-Lite0",
    description: "Smallest and fastest model. Ideal for mobile devices and low-power hardware.",
    path: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
    accuracy: "Low",
    speed: "Fastest",
  },
  {
    id: "efficientdet_lite2",
    name: "EfficientDet-Lite2",
    description: "Balanced model providing a good trade-off between speed and detection accuracy.",
    path: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite",
    accuracy: "Medium",
    speed: "Fast",
  },
  {
    id: "ssd_mobilenet_v2",
    name: "SSD MobileNet V2",
    description: "Standard mobile-optimized model with reliable performance across various object types.",
    path: "https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2/float16/1/ssd_mobilenet_v2.tflite",
    accuracy: "Medium",
    speed: "Fast",
  }
];
