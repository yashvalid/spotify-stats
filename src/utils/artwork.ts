// Deterministic geometric SVG artwork generator + genre mapping for offline/history records

const PRIMARY_ACCENTS = ['#FF0000', '#0000FF', '#FFFF00'];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateCoverArt(
  title: string,
  subtitle = '',
  _variant: 'album' | 'artist' = 'album'
): string {
  const hash = hashString(`${title}:${subtitle}`);
  const c1 = PRIMARY_ACCENTS[hash % 3];
  const c2 = PRIMARY_ACCENTS[(hash + 1) % 3];
  const c3 = PRIMARY_ACCENTS[(hash + 2) % 3];

  const vSplit = 76 + (hash % 72); // vertical line X between 76 and 148
  const hSplit = 72 + ((hash >> 3) % 76); // horizontal line Y between 72 and 148

  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .replace(/[<>&"']/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" fill="#FFFFFF"/>
    <rect x="0" y="0" width="${vSplit}" height="${hSplit}" fill="${c1}"/>
    <rect x="${vSplit}" y="${hSplit}" width="${240 - vSplit}" height="${240 - hSplit}" fill="#FFFFFF"/>
    <rect x="0" y="${hSplit}" width="${Math.floor(vSplit * 0.55)}" height="${240 - hSplit}" fill="${c2}"/>
    <rect x="${vSplit + Math.floor((240 - vSplit) * 0.55)}" y="0" width="${240 - (vSplit + Math.floor((240 - vSplit) * 0.55))}" height="${hSplit}" fill="${c3}"/>
    <line x1="${vSplit}" y1="0" x2="${vSplit}" y2="240" stroke="#111111" stroke-width="10"/>
    <line x1="0" y1="${hSplit}" x2="240" y2="${hSplit}" stroke="#111111" stroke-width="10"/>
    <line x1="${Math.floor(vSplit * 0.55)}" y1="${hSplit}" x2="${Math.floor(vSplit * 0.55)}" y2="240" stroke="#111111" stroke-width="8"/>
    <line x1="${vSplit + Math.floor((240 - vSplit) * 0.55)}" y1="0" x2="${vSplit + Math.floor((240 - vSplit) * 0.55)}" y2="${hSplit}" stroke="#111111" stroke-width="8"/>
    <rect x="4" y="4" width="232" height="232" fill="none" stroke="#111111" stroke-width="8"/>
    <rect x="82" y="90" width="76" height="60" fill="#111111"/>
    <text x="120" y="131" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="32" letter-spacing="1">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const KNOWN_ARTIST_GENRES: Record<string, string[]> = {
  'daft punk': ['French House', 'Electronic', 'Synthpop'],
  'kendrick lamar': ['Conscious Hip Hop', 'West Coast Rap', 'Hip Hop'],
  'radiohead': ['Art Rock', 'Alternative Rock', 'Experimental'],
  'tame impala': ['Psychedelic Pop', 'Neo-Psychedelia', 'Indie Rock'],
  'charli xcx': ['Hyperpop', 'Electropop', 'Club Pop'],
  'frank ocean': ['Alternative R&B', 'Neo-Soul', 'Art Pop'],
  'fred again..': ['UK Garage', 'House', 'Electronic'],
  'beach house': ['Dream Pop', 'Shoegaze', 'Indie Pop'],
  'sza': ['Contemporary R&B', 'Alternative R&B', 'Pop'],
  'the strokes': ['Garage Rock', 'Indie Rock', 'Post-Punk Revival'],
  'fleetwood mac': ['Classic Rock', 'Soft Rock', 'Yacht Rock'],
  'tyler, the creator': ['Alternative Hip Hop', 'Neo-Soul', 'Rap'],
  'arctic monkeys': ['Indie Rock', 'Sheffield Indie', 'Garage Rock'],
  'kaytranada': ['Alternative R&B', 'House', 'Nu-Disco'],
  'phoebe bridgers': ['Indie Folk', 'Sadcore', 'Chamber Pop'],
  'pink floyd': ['Progressive Rock', 'Psychedelic Rock', 'Art Rock'],
  'the weeknd': ['Synthwave', 'Alternative R&B', 'Pop'],
  'aphex twin': ['IDM', 'Ambient Techno', 'Electronic'],
  'mitski': ['Art Pop', 'Indie Rock', 'Chamber Pop'],
  'khruangbin': ['Psychedelic Funk', 'Surf Rock', 'Chillhop'],
  'bicep': ['Melodic Techno', 'Breakbeat', 'Electronic'],
  'bon iver': ['Indie Folk', 'Folktronica', 'Chamber Pop'],
  'floating points': ['Nu Jazz', 'Microhouse', 'Electronic'],
  'sufjan stevens': ['Chamber Folk', 'Indie Folk', 'Baroque Pop'],
  'caroline polachek': ['Art Pop', 'Alt-Pop', 'Electronic'],
  'mac demarco': ['Slacker Rock', 'Bedroom Pop', 'Indie Pop'],
  'lcd soundsystem': ['Dance-Punk', 'Indietronica', 'Synthpop'],
  'portishead': ['Trip Hop', 'Downtempo', 'Electronic'],
  'mf doom': ['Underground Hip Hop', 'Abstract Hip Hop', 'East Coast Rap'],
  'nujabes': ['Jazz Hop', 'Instrumental Hip Hop', 'Chillhop'],
};

const FALLBACK_GENRE_CLUSTERS = [
  ['Indie Rock', 'Alternative'],
  ['Electronic', 'Synthpop'],
  ['Alternative R&B', 'Neo-Soul'],
  ['Hip Hop', 'Rap'],
  ['Dream Pop', 'Indie Pop'],
  ['Art Pop', 'Experimental'],
  ['House', 'Nu-Disco'],
  ['Indie Folk', 'Chamber Pop'],
];

export function inferGenresForArtist(artistName: string, existingGenres?: string[]): string[] {
  if (existingGenres && existingGenres.length > 0) return existingGenres;
  const key = artistName.trim().toLowerCase();
  if (KNOWN_ARTIST_GENRES[key]) {
    return KNOWN_ARTIST_GENRES[key];
  }
  const h = hashString(key);
  return FALLBACK_GENRE_CLUSTERS[h % FALLBACK_GENRE_CLUSTERS.length];
}
