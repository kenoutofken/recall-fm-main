import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedMoods = ["Joyful", "Melancholy", "Nostalgic", "Peaceful", "Energized", "Bittersweet"];
const allowedTags = ["Family", "Friends", "Travel", "Holiday", "Adventure", "Relationship", "Solo", "Work"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const { notes } = await req.json();
    if (!notes || typeof notes !== "string") {
      return new Response(JSON.stringify({ error: "notes are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `
Turn the user's rough memory notes into a draft music memory form.

Return only JSON with this exact shape:
{
  "draft": {
    "title": "short title, max 80 characters",
    "description": "warm first-person memory description, 1-4 sentences",
    "songTitle": "song title if mentioned or inferable, otherwise empty string",
    "artist": "artist if mentioned or inferable, otherwise empty string",
    "date": "YYYY-MM-DD if clearly stated, otherwise empty string",
    "moods": ["one or more of: ${allowedMoods.join(", ")}"],
    "people": ["names or relationship labels mentioned in the notes"],
    "tags": ["one or more of: ${allowedTags.join(", ")}"]
  }
}

Rules:
- Do not invent a song or artist if the notes do not strongly imply one.
- Do not invent an exact date unless the user gave one.
- Keep tags limited to the allowed tag list.
- Keep moods limited to the allowed mood list.
- Preserve the user's meaning without adding dramatic details.

User notes:
${notes.slice(0, 4000)}
`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You convert rough notes into structured JSON for a music memory journal app.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("OpenAI draft-memory error:", status, text);

      return new Response(JSON.stringify({ error: `AI draft failed (${status})` }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No draft returned from AI");

    const parsed = JSON.parse(content);
    const draft = parsed?.draft ?? {};

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("draft-memory error:", error);
    const message = error instanceof Error ? error.message : "Failed to draft memory";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
