import React from "react";
export function useRecorder() {
  const [recording, setRecording] = React.useState(false);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    chunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.start(200);
    recRef.current = mr;
    setRecording(true);
  };

  const stop = async (): Promise<File | null> => {
    const mr = recRef.current;
    if (!mr) return null;
    return new Promise((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        setRecording(false);
        resolve(file);
      };
      mr.stop();
      recRef.current = null;
    });
  };

  return { start, stop, recording };
}
