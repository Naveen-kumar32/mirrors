/*
 * The clinic's Google rating, review count and latest reviews, from the Google Places API.
 * Optional: set GOOGLE_PLACES_API_KEY in .env (and GOOGLE_PLACE_ID if you know it — otherwise
 * it is looked up once by name). Results are cached for 12 hours. Google only returns up to
 * 5 reviews this way, and they must be shown with the author's name and a link to Google.
 */
const { GOOGLE_PLACES_API_KEY: KEY, GOOGLE_PLACE_ID, GOOGLE_PLACE_QUERY = 'The Mirrors Dermatology Clinic, Neelambur, Coimbatore' } =
  process.env;

const CACHE_MS = 12 * 60 * 60 * 1000;
let cache = null; // { at, data }
let placeId = GOOGLE_PLACE_ID || null;

async function places(path, init) {
  const res = await fetch(`https://places.googleapis.com/v1/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, ...init.headers },
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function findPlaceId() {
  const data = await places('places:searchText', {
    method: 'POST',
    headers: { 'X-Goog-FieldMask': 'places.id,places.displayName' },
    body: JSON.stringify({ textQuery: GOOGLE_PLACE_QUERY }),
  });
  const id = data.places?.[0]?.id;
  if (!id) throw new Error(`No Google place found for "${GOOGLE_PLACE_QUERY}"`);
  console.log(`Google Place ID: ${id} (${data.places[0].displayName?.text}) — set GOOGLE_PLACE_ID to skip this lookup`);
  return id;
}

export async function googleSummary() {
  if (!KEY) return null;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    placeId ||= await findPlaceId();
    const p = await places(`places/${placeId}`, {
      method: 'GET',
      headers: { 'X-Goog-FieldMask': 'id,rating,userRatingCount,googleMapsUri,reviews' },
    });
    const data = {
      rating: p.rating ?? null,
      count: p.userRatingCount ?? 0,
      url: p.googleMapsUri,
      reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
      checkedAt: new Date().toISOString(),
      reviews: (p.reviews || []).map((r) => ({
        name: r.authorAttribution?.displayName || 'Google user',
        authorUrl: r.authorAttribution?.uri,
        photo: r.authorAttribution?.photoUri,
        rating: r.rating,
        text: r.text?.text || r.originalText?.text || '',
        when: r.relativePublishTimeDescription,
        url: r.googleMapsUri,
      })),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    console.error('Could not load Google reviews:', err.message);
    return cache?.data || null; // keep showing the last good result
  }
}
