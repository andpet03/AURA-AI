// Supabase Edge Function: AI room creator (owned by Building).
// Deploy:  npx supabase functions deploy ai-room
// Secret:  npx supabase secrets set GEMINI_API_KEY=your_key
// Optional: npx supabase secrets set GEMINI_MODEL=<model id copied from Google AI Studio>
//
// The game sends { prompt, catalog: [item ids], activities: [ids] } and gets { room }.
// The game validates the result again, so a bad answer can never break a house.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { prompt, catalog = [], activities = [] } = await req.json();
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ room: null, error: 'GEMINI_API_KEY not set' });
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest';

    const system = `You design rooms for a cozy, family-friendly, low-poly house game.
Reply ONLY with JSON: {"name": string (max 24 chars), "vibe": one of ["cozy","pastel","modern","retro","nature","night"],
"theme": {"floor": "#rrggbb", "wall": "#rrggbb", "accent": "#rrggbb"},
"items": [{"kind": string, "label"?: string, "url"?: string}] (5 to 12 items)}.
"kind" MUST be one of: ${catalog.join(', ')}.
Pick items whose activities fit the request. Available activities: ${activities.join(', ')}.
For a portal or link, you may add a well-known https url (e.g. a booking or flight search site). Keep everything PG.`;

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: String(prompt).slice(0, 200) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      }),
    });
    if (!r.ok) return json({ room: null, error: `Gemini ${r.status}` });
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'null';
    return json({ room: JSON.parse(text) });
  } catch (e) {
    return json({ room: null, error: String(e) });
  }
});

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, 'Content-Type': 'application/json' } });
