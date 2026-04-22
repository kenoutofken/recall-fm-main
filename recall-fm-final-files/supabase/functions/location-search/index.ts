import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit, apiKey: fallbackApiKey } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEOAPIFY_API_KEY =
      Deno.env.get("GEOAPIFY_API_KEY") ||
      Deno.env.get("VITE_GEOAPIFY_API_KEY") ||
      (typeof fallbackApiKey === "string" ? fallbackApiKey : "");

    if (!GEOAPIFY_API_KEY) {
      return new Response(JSON.stringify({ error: "GEOAPIFY_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
    const params = new URLSearchParams({
      apiKey: GEOAPIFY_API_KEY,
      text: query.trim(),
      limit: String(searchLimit),
    });

    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Geoapify failed (${response.status})`, details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ features: data?.features ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("location-search error:", error);
    const message = error instanceof Error ? error.message : "Failed to search locations";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
