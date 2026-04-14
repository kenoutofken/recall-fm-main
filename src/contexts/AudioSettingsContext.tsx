import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AudioSettingsContextValue = {
  siteMuted: boolean;
  toggleSiteMuted: () => void;
  setSiteMuted: (muted: boolean) => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextValue | undefined>(undefined);
const STORAGE_KEY = "recallfm:site-muted";

export const AudioSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [siteMuted, setSiteMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(siteMuted));
  }, [siteMuted]);

  const value = useMemo(
    () => ({
      siteMuted,
      setSiteMuted,
      toggleSiteMuted: () => setSiteMuted((current) => !current),
    }),
    [siteMuted],
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
