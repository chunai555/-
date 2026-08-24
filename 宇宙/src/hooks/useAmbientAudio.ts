import { useCallback, useRef, useState } from "react";

const songUrl = "/assets/cosmos.mp3";

export function useAmbientAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.35);

  const createAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(songUrl);
    audio.setAttribute("data-song-ready", "cosmos.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;
    return audio;
  }, [volume]);

  const createGraph = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtx();
    const gain = context.createGain();
    gain.gain.value = volume * 0.16;
    gain.connect(context.destination);

    const notes = [196, 246.94, 329.63];
    oscillatorsRef.current = notes.map((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      noteGain.gain.value = index === 0 ? 0.42 : 0.18;
      oscillator.connect(noteGain);
      noteGain.connect(gain);
      oscillator.start();
      return oscillator;
    });

    contextRef.current = context;
    gainRef.current = gain;
    return context;
  }, [volume]);

  const toggle = useCallback(async () => {
    const audio = createAudio();
    if (isPlaying) {
      audio.pause();
      if (contextRef.current) {
        gainRef.current?.gain.setTargetAtTime(0, contextRef.current.currentTime, 0.08);
      }
      setIsPlaying(false);
      return;
    }
    try {
      audio.volume = volume;
      await audio.play();
      setIsPlaying(true);
      return;
    } catch {
      // Fall back to a generated ambient pad if the local song cannot be played.
    }

    const context = createGraph();
    if (context.state === "suspended") await context.resume();
    gainRef.current?.gain.setTargetAtTime(volume * 0.16, context.currentTime, 0.08);
    setIsPlaying(true);
  }, [createAudio, createGraph, isPlaying, volume]);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
    if (audioRef.current) {
      audioRef.current.volume = next;
    }
    const context = contextRef.current;
    if (context && gainRef.current && isPlaying) {
      gainRef.current.gain.setTargetAtTime(next * 0.16, context.currentTime, 0.05);
    }
  }, [isPlaying]);

  return { isPlaying, volume, toggle, setVolume };
}
