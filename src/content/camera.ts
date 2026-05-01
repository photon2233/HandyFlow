export interface CameraHandle {
  video: HTMLVideoElement;
  stop(): void;
}

export async function startCamera(video: HTMLVideoElement): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 480 },
      height: { ideal: 360 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.onloadeddata = () => resolve();
  });
  await video.play();
  return {
    video,
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}
