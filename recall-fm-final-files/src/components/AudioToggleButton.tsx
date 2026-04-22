import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useAudioSettings } from "@/contexts/AudioSettingsContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const AudioToggleButton = () => {
  const { siteMuted, siteVolume, setSiteMuted, setSiteVolume, toggleSiteMuted } = useAudioSettings();
  const volumePercent = Math.round(siteVolume * 100);
  const effectiveMuted = siteMuted || siteVolume === 0;

  const handleVolumeChange = ([value]: number[]) => {
    const nextVolume = value / 100;
    setSiteVolume(nextVolume);
    setSiteMuted(nextVolume === 0);
  };

  const handleToggleMuted = () => {
    if (effectiveMuted && siteVolume === 0) {
      setSiteVolume(0.7);
      setSiteMuted(false);
      return;
    }
    toggleSiteMuted();
  };

  const VolumeIcon = effectiveMuted ? VolumeX : siteVolume < 0.5 ? Volume1 : Volume2;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            effectiveMuted
              ? "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          aria-label="Audio settings"
          title={effectiveMuted ? "Sound off" : `Volume ${volumePercent}%`}
        >
          <VolumeIcon size={16} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-full w-[92vw] flex-col overflow-hidden p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5 text-left">
          <SheetTitle className="font-display">Audio</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Site sound</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {effectiveMuted ? "Muted" : `Playing at ${volumePercent}%`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMuted}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                effectiveMuted
                  ? "bg-muted text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              aria-label={effectiveMuted ? "Turn sound on" : "Mute site audio"}
              aria-pressed={effectiveMuted}
            >
              <VolumeIcon size={18} />
            </button>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="site-volume-slider">
                Volume
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">{volumePercent}%</span>
            </div>
            <Slider
              id="site-volume-slider"
              value={[volumePercent]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              aria-label="Site volume"
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[25, 50, 75].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleVolumeChange([preset])}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {preset}%
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggleMuted}
            className={cn(
              "mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              effectiveMuted
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <VolumeIcon size={15} />
            {effectiveMuted ? "Turn sound on" : "Mute site audio"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AudioToggleButton;
