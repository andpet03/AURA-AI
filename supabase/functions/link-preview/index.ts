// Supabase Edge Function: link previews for wish lists and link boards (owned by Building).
// Reads ONLY the page someone pasted, and returns its title + image (like chat apps do).
// Deploy: npx supabase functions deploy link-preview

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { url } = await req.json();
    if (!/^https?:\/\//i.test(url)) return json(null);
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OurPlaceLinkPreview/1.0)' }, redirect: 'follow' });
    const html = (await r.text()).slice(0, 300_000);
    const meta = (name: string) =>
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'))?.[1] || null;
    const title = meta('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    let image = meta('og:image') || meta('twitter:image');
    if (image && !/^https?:/i.test(image)) image = new URL(image, url).href;
    return json({ title, image, price: meta('product:price:amount') });
  } catch {
    return json(null);
  }
});

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, 'Content-Type': 'application/json' } });
