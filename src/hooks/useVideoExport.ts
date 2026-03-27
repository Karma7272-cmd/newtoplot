import { useState } from 'react';
import { convertWebmToMp4 } from '../services/videoExportService';

export const useVideoExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportVideo = async (webmBlob: Blob, fileName: string) => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const mp4Blob = await convertWebmToMp4(webmBlob, (progress) => {
        setExportProgress(Math.round(progress * 100));
      });

      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export video. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    exportVideo,
    isExporting,
    exportProgress,
    error
  };
};
