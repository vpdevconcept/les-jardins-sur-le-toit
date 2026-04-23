import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/bg-music.mp3");
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    audio.addEventListener("canplaythrough", () => setReady(true));
    audioRef.current = audio;

    // Listen for splash screen "start audio" event
    const handleStartAudio = () => {
      audio.play().then(() => {
        const steps = 30;
        const interval = 1500 / steps;
        let step = 0;
        const fade = setInterval(() => {
          step++;
          audio.volume = Math.min(step / steps * 0.4, 0.4);
          if (step >= steps) clearInterval(fade);
        }, interval);
        setPlaying(true);
      }).catch(() => {});
    };
    window.addEventListener("greenshake-start-audio", handleStartAudio);

    return () => {
      window.removeEventListener("greenshake-start-audio", handleStartAudio);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const fadeIn = (audio: HTMLAudioElement, duration = 1500) => {
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      audio.volume = Math.min(step / steps * 0.4, 0.4);
      if (step >= steps) clearInterval(fade);
    }, interval);
  };

  const fadeOut = (audio: HTMLAudioElement, duration = 800) => {
    const startVol = audio.volume;
    const steps = 20;
    const interval = duration / steps;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      audio.volume = Math.max(startVol * (1 - step / steps), 0);
      if (step >= steps) {
        clearInterval(fade);
        audio.pause();
      }
    }, interval);
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      fadeOut(audio);
      setPlaying(false);
    } else {
      audio.play().then(() => {
        fadeIn(audio);
        setPlaying(true);
      }).catch(() => {});
    }
  };

  if (!ready) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center
        bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg
        hover:bg-card/80 transition-all duration-300"
      aria-label={playing ? "Couper la musique" : "Activer la musique"}
    >
      <AnimatePresence mode="wait">
        {playing ? (
          <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Volume2 size={20} className="text-primary" />
          </motion.div>
        ) : (
          <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <VolumeX size={20} className="text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
      {playing && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default AudioPlayer;
