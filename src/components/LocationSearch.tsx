import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

type GeoapifyFeature = {
  properties?: {
    formatted?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lon?: number;
    place_id?: string;
  };
};

export type LocationResult = {
  name: string;
  lat: number;
  lng: number;
  placeId: string | null;
};

type LocationSearchProps = {
  value: string;
  onChange: (value: string, location?: LocationResult | null) => void;
  maxLength?: number;
};

const GEOAPIFY_AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

const getFeatureName = (feature: GeoapifyFeature) => {
  const props = feature.properties;
  if (!props) return "";

  if (props.formatted) return props.formatted;

  return [props.name, props.city, props.state, props.country].filter(Boolean).join(", ");
};

const toLocationResult = (feature: GeoapifyFeature): LocationResult | null => {
  const props = feature.properties;
  const name = getFeatureName(feature);

  if (!props || !name || typeof props.lat !== "number" || typeof props.lon !== "number") {
    return null;
  }

  return {
    name,
    lat: props.lat,
    lng: props.lon,
    placeId: props.place_id ?? null,
  };
};

const LocationSearch = ({ value, onChange, maxLength = 120 }: LocationSearchProps) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiKey || value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const search = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          apiKey,
          text: value.trim(),
          limit: "5",
        });

        const response = await fetch(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Geoapify failed (${response.status})`);

        const data = await response.json();
        const nextSuggestions = (data.features ?? [])
          .map(toLocationResult)
          .filter((item: LocationResult | null): item is LocationResult => Boolean(item))
          .filter((item: LocationResult, index: number, items: LocationResult[]) => (
            items.findIndex((candidate) => candidate.name === item.name) === index
          ))
          .slice(0, 5);

        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Location search failed:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(search);
      controller.abort();
    };
  }, [apiKey, value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectSuggestion = (suggestion: LocationResult) => {
    onChange(suggestion.name.slice(0, maxLength), suggestion);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value.slice(0, maxLength), null);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder="e.g. Stanley Park, Vancouver"
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        maxLength={maxLength}
        autoComplete="off"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId ?? `${suggestion.lat}:${suggestion.lng}:${suggestion.name}`}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2">{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
