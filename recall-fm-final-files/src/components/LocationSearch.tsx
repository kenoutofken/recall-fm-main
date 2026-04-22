import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

type GeoapifyAutocompleteResponse = {
  features?: GeoapifyFeature[];
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
  menuPlacement?: "top" | "bottom";
};

const GEOAPIFY_AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

const getFeatureName = (feature: GeoapifyFeature) => {
  // Geoapify may return different fields depending on the place, so build the best label available.
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

const normalizeSuggestions = (features: GeoapifyFeature[] = []) => (
  // Keep only complete, unique locations and limit the menu to a short usable list.
  features
    .map(toLocationResult)
    .filter((item: LocationResult | null): item is LocationResult => Boolean(item))
    .filter((item: LocationResult, index: number, items: LocationResult[]) => (
      items.findIndex((candidate) => candidate.name === item.name) === index
    ))
    .slice(0, 5)
);

const LocationSearch = ({ value, onChange, maxLength = 120, menuPlacement = "bottom" }: LocationSearchProps) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      setStatusMessage(null);
      return;
    }

    const controller = new AbortController();
    const search = window.setTimeout(async () => {
      // Search is delayed slightly so users can finish typing before requests are sent.
      setLoading(true);
      setStatusMessage(null);

      try {
        let nextSuggestions: LocationResult[] = [];

        try {
          // Prefer the edge function; fall back to direct Geoapify if local/dev configuration needs it.
          const { data, error } = await supabase.functions.invoke<GeoapifyAutocompleteResponse>("location-search", {
            body: { query: value.trim(), limit: 5, apiKey },
          });

          if (error) throw error;
          nextSuggestions = normalizeSuggestions(data?.features);
        } catch (functionError) {
          console.warn("Location function failed, falling back to browser search:", functionError);

          if (!apiKey) throw new Error("Geoapify API key is not configured");

          const params = new URLSearchParams({
            apiKey,
            text: value.trim(),
            limit: "5",
          });

          const response = await fetch(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) throw new Error(`Geoapify failed (${response.status})`);

          const data = (await response.json()) as GeoapifyAutocompleteResponse;
          nextSuggestions = normalizeSuggestions(data.features);
        }

        setSuggestions(nextSuggestions);
        setStatusMessage(nextSuggestions.length > 0 ? null : "No locations found.");
        setOpen(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Location search failed:", error);
          setSuggestions([]);
          setStatusMessage("Location suggestions unavailable. You can still type a place.");
          setOpen(true);
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
    // Returning coordinates lets memories appear on the map and improves location filtering.
    onChange(suggestion.name.slice(0, maxLength), suggestion);
    setStatusMessage(null);
    setOpen(false);
  };

  const menuPositionClass = menuPlacement === "top" ? "bottom-full mb-1" : "top-full mt-1";
  const showMenu = open && (loading || suggestions.length > 0 || statusMessage);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value.slice(0, maxLength), null);
          setStatusMessage(null);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0 || statusMessage) setOpen(true);
        }}
        placeholder="e.g. Stanley Park, Vancouver"
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        maxLength={maxLength}
        autoComplete="off"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
      </div>

      {showMenu && (
        <div className={`absolute left-0 right-0 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-lg ${menuPositionClass}`}>
          {loading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Searching places...
            </div>
          )}
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId ?? `${suggestion.lat}:${suggestion.lng}:${suggestion.name}`}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2">{suggestion.name}</span>
            </button>
          ))}
          {!loading && suggestions.length === 0 && statusMessage && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
