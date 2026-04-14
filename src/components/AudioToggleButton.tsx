import { Volume2, VolumeX } from "lucide-react";
import { useAudioSettings } from "@/contexts/AudioSettingsContext";
import { cn } from "@/lib/utils";

const AudioToggleButton = () => {
  const { siteMuted, toggleSiteMuted } = useAudioSettings();

  return (
    <button
      type="button"
      onClick={toggleSiteMuted}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        siteMuted
          ? "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
      aria-label={siteMuted ? "Turn sound on" : "Mute site audio"}
      title={siteMuted ? "Sound off" : "Sound on"}
      aria-pressed={!siteMuted}
    >
      {siteMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
};

export default AudioToggleButton;
