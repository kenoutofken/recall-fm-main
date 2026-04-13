import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import { Memory } from "@/types/memory";
import MemoryDetailModal from "@/components/MemoryDetailModal";

const TILE_SIZE = 256;
const MIN_ZOOM = 0;
const MAX_ZOOM = 15;
const DEFAULT_ZOOM = 11;
const MAX_LATITUDE = 85.05112878;

type MemoryMapProps = {
  memories: Memory[];
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
};

type MapPoint = {
  memory: Memory;
  lat: number;
  lng: number;
};

type LatLng = {
  lat: number;
  lng: number;
};

type PixelPoint = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), min);

const clampLatitude = (lat: number) => clamp(lat, -MAX_LATITUDE, MAX_LATITUDE);

const normalizeLongitude = (lng: number) => {
  const normalized = ((lng + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
};

const project = (lat: number, lng: number, zoom: number): PixelPoint => {
  const scale = TILE_SIZE * 2 ** zoom;
  const clampedLat = clampLatitude(lat);
  const latRadians = (clampedLat * Math.PI) / 180;

  return {
    x: ((normalizeLongitude(lng) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + Math.sin(latRadians)) / (1 - Math.sin(latRadians))) / (4 * Math.PI)) * scale,
  };
};

const unproject = (point: PixelPoint, zoom: number): LatLng => {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return {
    lat: clampLatitude(lat),
    lng: normalizeLongitude(lng),
  };
};

const getLngSpan = (points: MapPoint[]) => {
  if (points.length === 1) {
    return {
      center: points[0].lng,
      span: 0,
      normalizedLons: [points[0].lng + 180],
    };
  }

  const normalizedLons = points
    .map((point) => normalizeLongitude(point.lng) + 180)
    .sort((a, b) => a - b);
  let largestGap = -1;
  let largestGapIndex = 0;

  for (let index = 0; index < normalizedLons.length; index += 1) {
    const nextIndex = (index + 1) % normalizedLons.length;
    const current = normalizedLons[index];
    const next = nextIndex === 0 ? normalizedLons[0] + 360 : normalizedLons[nextIndex];
    const gap = next - current;

    if (gap > largestGap) {
      largestGap = gap;
      largestGapIndex = index;
    }
  }

  const startIndex = (largestGapIndex + 1) % normalizedLons.length;
  const start = normalizedLons[startIndex];
  const end = normalizedLons[largestGapIndex] < start
    ? normalizedLons[largestGapIndex] + 360
    : normalizedLons[largestGapIndex];
  const span = end - start;
  const center = normalizeLongitude(((start + span / 2) % 360) - 180);

  return { center, span, normalizedLons };
};

const getFittedViewport = (points: MapPoint[], width: number, height: number) => {
  const latitudes = points.map((point) => point.lat);
  const lngSpan = getLngSpan(points);
  const center = {
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    lng: lngSpan.center,
  };

  if (points.length === 1) {
    return { center, zoom: DEFAULT_ZOOM };
  }

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom -= 1) {
    const projectedCenter = project(center.lat, center.lng, zoom);
    const projected = points.map((point) => project(point.lat, point.lng, zoom));
    const adjusted = projected.map((point) => {
      const scale = TILE_SIZE * 2 ** zoom;
      let x = point.x;

      if (x - projectedCenter.x > scale / 2) x -= scale;
      if (projectedCenter.x - x > scale / 2) x += scale;

      return { x, y: point.y };
    });
    const xs = adjusted.map((point) => point.x);
    const ys = adjusted.map((point) => point.y);
    const spreadX = Math.max(...xs) - Math.min(...xs);
    const spreadY = Math.max(...ys) - Math.min(...ys);

    if (spreadX <= width * 0.68 && spreadY <= height * 0.68) {
      return { center, zoom };
    }
  }

  return { center, zoom: MIN_ZOOM };
};

const wrapTileX = (x: number, zoom: number) => {
  const tileCount = 2 ** zoom;
  return ((x % tileCount) + tileCount) % tileCount;
};

const MemoryMap = ({ memories, onDelete, onEdit }: MemoryMapProps) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; centerPixels: PixelPoint } | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [size, setSize] = useState({ width: 480, height: 360 });
  const [center, setCenter] = useState<LatLng>({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.max(entry.contentRect.width, 1);
      const nextHeight = Math.max(entry.contentRect.height, 1);
      setSize({ width: nextWidth, height: nextHeight });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(() => {
    return memories
      .filter((memory): memory is Memory & { locationLat: number; locationLng: number } => (
        typeof memory.locationLat === "number" &&
        typeof memory.locationLng === "number"
      ))
      .map((memory) => ({
        memory,
        lat: memory.locationLat,
        lng: memory.locationLng,
      }));
  }, [memories]);

  const pointSignature = useMemo(() => {
    return points.map((point) => `${point.memory.id}:${point.lat}:${point.lng}`).join("|");
  }, [points]);

  const fitToPins = useCallback(() => {
    if (points.length === 0) return;

    const fitted = getFittedViewport(points, size.width, size.height);
    setCenter(fitted.center);
    setZoom(fitted.zoom);
  }, [points, size.height, size.width]);

  useEffect(() => {
    fitToPins();
  }, [fitToPins, pointSignature]);

  const changeZoom = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  const mapState = useMemo(() => {
    if (points.length === 0) return null;

    const centerPixels = project(center.lat, center.lng, zoom);
    const centerTile = {
      x: Math.floor(centerPixels.x / TILE_SIZE),
      y: Math.floor(centerPixels.y / TILE_SIZE),
    };
    const horizontalTiles = Math.ceil(size.width / TILE_SIZE / 2) + 1;
    const verticalTiles = Math.ceil(size.height / TILE_SIZE / 2) + 1;

    const tiles = [];
    for (let xOffset = -horizontalTiles; xOffset <= horizontalTiles; xOffset += 1) {
      for (let yOffset = -verticalTiles; yOffset <= verticalTiles; yOffset += 1) {
        const tileX = centerTile.x + xOffset;
        const tileY = centerTile.y + yOffset;
        const tileCount = 2 ** zoom;
        if (tileY < 0 || tileY >= tileCount) continue;

        tiles.push({
          key: `${tileX}:${tileY}`,
          urlX: wrapTileX(tileX, zoom),
          urlY: tileY,
          left: size.width / 2 + tileX * TILE_SIZE - centerPixels.x,
          top: size.height / 2 + tileY * TILE_SIZE - centerPixels.y,
        });
      }
    }

    return { centerPixels, tiles };
  }, [center.lat, center.lng, points.length, size.height, size.width, zoom]);

  const positionedPoints = useMemo(() => {
    if (!mapState) return [];

    const basePoints = points.map((point) => {
      const projected = project(point.lat, point.lng, zoom);
      const scale = TILE_SIZE * 2 ** zoom;
      let adjustedX = projected.x;

      if (adjustedX - mapState.centerPixels.x > scale / 2) adjustedX -= scale;
      if (mapState.centerPixels.x - adjustedX > scale / 2) adjustedX += scale;

      return {
        ...point,
        left: size.width / 2 + adjustedX - mapState.centerPixels.x,
        top: size.height / 2 + projected.y - mapState.centerPixels.y,
      };
    });
    const groups = new Map<string, typeof basePoints>();

    basePoints.forEach((point) => {
      const key = `${Math.round(point.left / 36)}:${Math.round(point.top / 36)}`;
      const group = groups.get(key) ?? [];
      group.push(point);
      groups.set(key, group);
    });

    return Array.from(groups.values()).flatMap((group) => {
      if (group.length === 1) return group;

      const radius = Math.min(46, 18 + group.length * 4);
      return group.map((point, index) => {
        const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...point,
          left: point.left + Math.cos(angle) * radius,
          top: point.top + Math.sin(angle) * radius,
        };
      });
    });
  }, [mapState, points, size.height, size.width, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerPixels: project(center.lat, center.lng, zoom),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setCenter(unproject({
      x: drag.centerPixels.x - (event.clientX - drag.startX),
      y: drag.centerPixels.y - (event.clientY - drag.startY),
    }, zoom));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? 1 : -1));
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
      <div
        ref={containerRef}
        className="relative h-[420px] touch-none overflow-hidden rounded-lg border border-border bg-muted cursor-grab active:cursor-grabbing"
        aria-label="Memory map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {mapState && apiKey ? (
          mapState.tiles.map((tile) => (
            <img
              key={tile.key}
              src={`https://maps.geoapify.com/v1/tile/osm-bright/${zoom}/${tile.urlX}/${tile.urlY}.png?apiKey=${apiKey}`}
              alt=""
              className="absolute h-64 w-64 select-none"
              draggable={false}
              style={{ left: tile.left, top: tile.top }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}

        {positionedPoints.map((point, index) => (
          <button
            key={point.memory.id}
            type="button"
            onClick={() => setSelectedMemory(point.memory)}
            className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md ring-2 ring-background transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ left: point.left, top: point.top, zIndex: positionedPoints.length - index }}
          >
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              <span className="max-w-28 truncate">{point.memory.title}</span>
            </span>
          </button>
        ))}

        <div className="absolute right-3 top-3 z-[1000] flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <button
            type="button"
            onClick={() => changeZoom(zoom + 1)}
            className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => changeZoom(zoom - 1)}
            className="flex h-9 w-9 items-center justify-center border-t border-border text-foreground hover:bg-muted disabled:opacity-40"
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={fitToPins}
            className="flex h-9 w-9 items-center justify-center border-t border-border text-foreground hover:bg-muted"
            aria-label="Fit pins"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-border bg-background/90 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
          {points.length} {points.length === 1 ? "pin" : "pins"} · zoom {zoom}
        </div>

        {!apiKey && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
            Add VITE_GEOAPIFY_API_KEY to .env and restart the dev server to load map tiles.
          </div>
        )}
      </div>

      <MemoryDetailModal
        memory={selectedMemory}
        open={!!selectedMemory}
        onOpenChange={(open) => { if (!open) setSelectedMemory(null); }}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
};

export default MemoryMap;
