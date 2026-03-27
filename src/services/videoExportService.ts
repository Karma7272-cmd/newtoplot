import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const convertWebmToMp4 = async (
  webmBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const ffmpeg = await loadFFmpeg();
  
  const inputName = 'input.webm';
  const outputName = 'output.mp4';

  ffmpeg.on('log', ({ message }) => {
    console.log('FFmpeg:', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) onProgress(progress);
  });

  await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

  // Convert to MP4
  // Using fast settings for browser performance
  await ffmpeg.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  const mp4Blob = new Blob([data], { type: 'video/mp4' });

  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return mp4Blob;
};
