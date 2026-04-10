import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchLimit = Math.min(Math.max(Number(limit) || 1, 1), 10);
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${searchLimit}`;
    const res = await fetch(url);
    const data = await res.json();

    const tracks = (data?.data ?? []).map((track: any) => ({
      preview: track.preview,
      title: track.title,
      artist: track.artist?.name,
      album: track.album?.title,
      albumCover: track.album?.cover_medium ?? track.album?.cover_small,
      duration: track.duration,
    }));

    // Backward compat: return single track + array
    return new Response(JSON.stringify({ track: tracks[0] ?? null, tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Deezer search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search Deezer' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
