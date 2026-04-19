import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AudioSettingsContextValue = {
  siteMuted: boolean;
  siteVolume: number;
  toggleSiteMuted: () => void;
  setSiteMuted: (muted: boolean) => void;
  setSiteVolume: (volume: number) => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextValue | undefined>(undefined);
const MUTED_STORAGE_KEY = "recallfm:site-muted";
const VOLUME_STORAGE_KEY = "recallfm:site-volume";
const DEFAULT_VOLUME = 0.75;

const clampVolume = (volume: number) => Math.min(Math.max(volume, 0), 1);

export const AudioSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [siteMuted, setSiteMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTED_STORAGE_KEY) === "true";
  });
  const [siteVolume, setSiteVolumeState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    const savedVolume = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(savedVolume) ? clampVolume(savedVolume) : DEFAULT_VOLUME;
  });

  useEffect(() => {
    window.localStorage.setItem(MUTED_STORAGE_KEY, String(siteMuted));
  }, [siteMuted]);

  useEffect(() => {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(siteVolume));
  }, [siteVolume]);

  const value = useMemo(
    () => ({
      siteMuted,
      siteVolume,
      setSiteMuted,
      setSiteVolume: (volume: number) => setSiteVolumeState(clampVolume(volume)),
      toggleSiteMuted: () => setSiteMuted((current) => !current),
    }),
    [siteMuted, siteVolume],
  );

  return (
    <AudioSettingsContext.Provider value={value}>
      {children}
    </AudioSettingsContext.Provider>
  );
};

export const useAudioSettings = () => {
  const context = useContext(AudioSettingsContext);
  if (!context) {
    throw new Error("useAudioSettings must be used within AudioSettingsProvider");
  }
  return context;
};
