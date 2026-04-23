import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Map, { Marker, NavigationControl, type MapRef, type MapStyle } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Calendar, Heart, MapPin, Music } from "lucide-react";
import { Memory } from "@/types/memory";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatMemoryTime } from "@/lib/memoryTime";

const DEFAULT_VIEW = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 2.8,
};

type MemoryMapProps = {
  memories: Memory[];
  detailState?: unknown;
  onMemorySelect?: (memory: Memory) => void;
};

type MapPoint = {
  memory: Memory;
  latitude: number;
  longitude: number;
};

type MemoryCluster = {
  id: string;
  latitude: number;
  longitude: number;
  screenX: number;
  screenY: number;
  memories: Memory[];
};

const CLUSTER_RADIUS = 58;
const COUNTRY_CLUSTER_DISTANCE_KM = 2200;

const isLikelyNullIsland = (point: MapPoint) => (
  Math.abs(point.latitude) < 0.5 && Math.abs(point.longitude) < 0.5
);

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (a: MapPoint, b: MapPoint) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(b.latitude - a.latitude);
  const lngDelta = toRadians(b.longitude - a.longitude);
  const startLat = toRadians(a.latitude);
  const endLat = toRadians(b.latitude);

  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const blankMapStyle: MapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "hsl(var(--muted))",
      },
    },
  ],
};

const getGeoapifyStyle = (apiKey: string): MapStyle => ({
  version: 8,
  sources: {
    geoapify: {
      type: "raster",
      tiles: [`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors, &copy; Geoapify",
    },
  },
  layers: [
    {
      id: "geoapify",
      type: "raster",
      source: "geoapify",
    },
  ],
});

const MemoryMap = ({ memories, detailState, onMemorySelect }: MemoryMapProps) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [viewportTick, setViewportTick] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedMemories, setSelectedMemories] = useState<Memory[]>([]);

  const points = useMemo(() => {
    return memories
      .filter((memory): memory is Memory & { locationLat: number; locationLng: number } => (
        typeof memory.locationLat === "number" &&
        typeof memory.locationLng === "number"
      ))
      .map((memory) => ({
        memory,
        latitude: memory.locationLat,
        longitude: memory.locationLng,
      }));
  }, [memories]);

  const pointSignature = useMemo(() => {
    return points.map((point) => `${point.memory.id}:${point.latitude}:${point.longitude}`).join("|");
  }, [points]);

  const viewportPoints = useMemo(() => {
    if (points.length <= 1) return points;

    const nonNullIslandPoints = points.filter((point) => !isLikelyNullIsland(point));
    return nonNullIslandPoints.length > 0 ? nonNullIslandPoints : points;
  }, [points]);

  const dominantRegionPoints = useMemo(() => {
    if (viewportPoints.length <= 1) return viewportPoints;

    const geographicClusters: MapPoint[][] = [];

    viewportPoints.forEach((point) => {
      const matchingCluster = geographicClusters.find((cluster) =>
        cluster.some((clusterPoint) => getDistanceKm(clusterPoint, point) <= COUNTRY_CLUSTER_DISTANCE_KM)
      );

      if (matchingCluster) {
        matchingCluster.push(point);
        return;
      }

      geographicClusters.push([point]);
    });

    return geographicClusters.reduce((largestCluster, cluster) => (
      cluster.length > largestCluster.length ? cluster : largestCluster
    ), geographicClusters[0]);
  }, [viewportPoints]);

  const mapStyle = useMemo(() => {
    return apiKey ? getGeoapifyStyle(apiKey) : blankMapStyle;
  }, [apiKey]);

  const clusters = useMemo(() => {
    void viewportTick;
    const map = mapRef.current;
    if (!mapReady || !map) {
      return points.map((point) => ({
        id: point.memory.id,
        latitude: point.latitude,
        longitude: point.longitude,
        screenX: 0,
        screenY: 0,
        memories: [point.memory],
      }));
    }

    const nextClusters: MemoryCluster[] = [];

    points.forEach((point) => {
      const screenPoint = map.project([point.longitude, point.latitude]);
      const existingCluster = nextClusters.find((cluster) => {
        const distance = Math.hypot(cluster.screenX - screenPoint.x, cluster.screenY - screenPoint.y);
        return distance <= CLUSTER_RADIUS;
      });

      if (!existingCluster) {
        nextClusters.push({
          id: point.memory.id,
          latitude: point.latitude,
          longitude: point.longitude,
          screenX: screenPoint.x,
          screenY: screenPoint.y,
          memories: [point.memory],
        });
        return;
      }

      const nextCount = existingCluster.memories.length + 1;
      existingCluster.latitude = ((existingCluster.latitude * existingCluster.memories.length) + point.latitude) / nextCount;
      existingCluster.longitude = ((existingCluster.longitude * existingCluster.memories.length) + point.longitude) / nextCount;
      existingCluster.screenX = ((existingCluster.screenX * existingCluster.memories.length) + screenPoint.x) / nextCount;
      existingCluster.screenY = ((existingCluster.screenY * existingCluster.memories.length) + screenPoint.y) / nextCount;
      existingCluster.memories.push(point.memory);
      existingCluster.id = existingCluster.memories.map((memory) => memory.id).join("-");
    });

    return nextClusters;
  }, [mapReady, points, viewportTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || dominantRegionPoints.length === 0) return;

    if (dominantRegionPoints.length === 1) {
      map.flyTo({
        center: [dominantRegionPoints[0].longitude, dominantRegionPoints[0].latitude],
        zoom: 11,
        duration: 500,
      });
      window.setTimeout(() => setViewportTick((tick) => tick + 1), 550);
      return;
    }

    const longitudes = dominantRegionPoints.map((point) => point.longitude);
    const latitudes = dominantRegionPoints.map((point) => point.latitude);

    map.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      {
        padding: 64,
        maxZoom: 6,
        duration: 500,
      },
    );
    window.setTimeout(() => setViewportTick((tick) => tick + 1), 550);
  }, [dominantRegionPoints, mapReady, pointSignature]);

  const openClusterPanel = (memoriesInCluster: Memory[]) => {
    setSelectedMemories(memoriesInCluster);
    setPanelOpen(true);
  };

  const openMemory = (memory: Memory) => {
    setPanelOpen(false);
    if (onMemorySelect) {
      onMemorySelect(memory);
      return;
    }

    navigate(`/journal/memories/${memory.id}`, {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
          uiState: detailState,
        },
      },
    });
  };

  if (points.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
        <MapPin size={24} className="mb-3 text-muted-foreground" />
        <h2 className="font-display text-base font-semibold text-foreground">No pinned memories yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a location from autocomplete when saving a memory.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-muted">
        <Map
          ref={mapRef}
          initialViewState={DEFAULT_VIEW}
          mapStyle={mapStyle}
          cooperativeGestures
          dragRotate={false}
          touchPitch={false}
          minZoom={1}
          maxZoom={16}
          onLoad={() => {
            setMapReady(true);
            setViewportTick((tick) => tick + 1);
          }}
          onMoveEnd={() => setViewportTick((tick) => tick + 1)}
          onZoomEnd={() => setViewportTick((tick) => tick + 1)}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} visualizePitch={false} />

          {clusters.map((cluster) => (
            <Marker
              key={cluster.id}
              longitude={cluster.longitude}
              latitude={cluster.latitude}
              anchor="center"
            >
              <button
                type="button"
                onClick={() => openClusterPanel(cluster.memories)}
                className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${cluster.memories.length} ${cluster.memories.length === 1 ? "memory" : "memories"} in this area`}
              >
                <Heart
                  size={42}
                  fill="currentColor"
                  strokeWidth={2.3}
                  className="absolute inset-0 m-auto text-primary drop-shadow-md transition-colors group-hover:text-primary/90"
                />
                <span className="absolute left-1/2 top-[45%] z-10 flex h-4 min-w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-[11px] font-bold leading-none text-primary-foreground">
                  {cluster.memories.length}
                </span>
              </button>
            </Marker>
          ))}
        </Map>

        {!apiKey && (
          <div className="absolute bottom-3 left-3 right-3 z-10 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
            Add VITE_GEOAPIFY_API_KEY to .env and restart the dev server to load map tiles.
          </div>
        )}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="flex h-full w-[92vw] flex-col overflow-hidden p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border px-5 pb-3 pt-5 text-left">
            <SheetTitle className="font-display">
              {selectedMemories.length === 1 ? "1 memory here" : `${selectedMemories.length} memories here`}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">Songs and moments saved around this area.</p>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {selectedMemories.map((memory) => (
              <button
                key={memory.id}
                type="button"
                onClick={() => openMemory(memory)}
                className="card-strong w-full rounded-lg border-2 border-foreground/70 bg-white px-3 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block truncate text-sm font-semibold text-foreground">{memory.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Music size={12} className="shrink-0" />
                  <span className="truncate">{memory.songTitle} - {memory.artist}</span>
                </span>
                {memory.locationName && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{memory.locationName}</span>
                  </span>
                )}
                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} className="shrink-0" />
                  <span>{formatMemoryTime(memory)}</span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MemoryMap;
