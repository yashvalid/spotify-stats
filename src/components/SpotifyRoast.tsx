import React, { useMemo, useState } from 'react';
import {
  Flame,
  RefreshCw,
  Download,
  Copy,
  Check,
  Sparkles,
  Skull,
  Glasses,
  HeartCrack,
  Mic2,
  Music2,
  Disc3,
  Clock,
} from 'lucide-react';
import { ListeningStats } from '../types';

interface Props {
  stats: ListeningStats;
}

type RoastTone = 'ruthless' | 'pitchfork' | 'therapist' | 'mild';

interface RoastCardData {
  headline: string;
  subheadline: string;
  tasteRating: string;
  basicScore: number;
  redFlagLevel: string;
  openingMonologue: string;
  artistRoasts: { artist: string; coverUrl: string; line: string }[];
  trackRoast: string;
  genreRoast: string;
  clockRoast: string;
  prescription: string;
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function formatHourLabel(hr: number): string {
  if (hr === 0) return '12:00 AM';
  if (hr === 12) return '12:00 PM';
  return hr > 12 ? `${hr - 12}:00 PM` : `${hr}:00 AM`;
}

function getSpecificArtistJab(artistName: string, genre: string, tone: RoastTone, variant: number): string {
  const lower = artistName.toLowerCase();
  const gLower = genre.toLowerCase();

  if (lower.includes('taylor swift')) {
    return 'Having Taylor Swift at the top of your rotation means you treat every minor inconvenience like a 10-minute short film directed by yourself.';
  }
  if (lower.includes('drake')) {
    return 'Listening to this much Drake in 2026 means you definitely still send "you up?" texts at 1:47 AM and call yourself a certified lover boy.';
  }
  if (lower.includes('the weeknd')) {
    return 'The Weeknd in heavy rotation? You romanticize toxic nightlife from the comfort of your bed while scrolling your phone in the dark.';
  }
  if (lower.includes('radiohead') || lower.includes('smiths') || lower.includes('phoebe bridgers') || lower.includes('mitski')) {
    return `${artistName} at the top of your chart? Blink twice if you haven't felt unconditional joy since 2019.`;
  }
  if (lower.includes('kanye') || lower.includes('ye') || lower.includes('travis scott') || lower.includes('playboi carti')) {
    return `Having ${artistName} this high means 80% of your personality is bass-boosted delusions of grandeur.`;
  }
  if (lower.includes('lana del rey') || lower.includes('arctic monkeys') || lower.includes('neighbourhood') || lower.includes('cigarettes after sex')) {
    return `${artistName}? Your entire music taste was curated by a 2014 Tumblr moodboard that never grew up.`;
  }
  if (lower.includes('kendrick lamar') || lower.includes('frank ocean') || lower.includes('tyler, the creator')) {
    return `${artistName} is elite, sure—unfortunately you bring it up in every conversation like you personally produced the album.`;
  }
  if (lower.includes('daft punk') || lower.includes('tame impala') || lower.includes('gorillaz')) {
    return `${artistName} in the top spot: the universal uniform of someone who says "I actually listen to everything" before playing the exact same 12 tracks.`;
  }
  if (lower.includes('billie eilish') || lower.includes('olivia rodrigo') || lower.includes('sabrina carpenter') || lower.includes('chappell roan')) {
    return `${artistName} dominating your streams—your algorithm is one breakup away from staging a full theatrical musical in your bedroom mirror.`;
  }
  if (lower.includes('bad bunny') || lower.includes('peso pluma') || lower.includes('feid') || lower.includes('karol g')) {
    return `${artistName} on lock: you treat every Tuesday commute like you're VIP at a beach club in San Juan.`;
  }
  if (lower.includes('arijit') || lower.includes('pritam') || lower.includes('rahman') || lower.includes('anirudh') || lower.includes('diljit')) {
    return `${artistName} at the top—your headphones are basically a full-time cinematic montage machine.`;
  }

  if (tone === 'pitchfork') {
    const templates = [
      `Your reliance on ${artistName} reveals a pedestrian attachment to ${genre || 'accessible hooks'} that mistakes repetition for curatorial depth. Score: 4.2 / 10.`,
      `Centering your entire sonic identity around ${artistName} feels derivative—like a mid-tier festival lineup designed by an algorithm with commitment issues.`,
      `${artistName} as a cornerstone artist? Boldly unoriginal. It's sonic wallpaper for people who read album reviews instead of going outside.`,
    ];
    return templates[variant % templates.length];
  }

  if (tone === 'therapist') {
    const templates = [
      `We need to talk about how you use ${artistName} to regulate your nervous system instead of processing your actual feelings.`,
      `Streaming ${artistName} on loop isn't "vibing"—it's emotional avoidance dressed up as ${genre || 'a playlist'}.`,
      `Notice how whenever life gets overwhelming, you immediately retreat into ${artistName}. What are we running from?`,
    ];
    return templates[variant % templates.length];
  }

  if (tone === 'mild') {
    const templates = [
      `You and ${artistName} are practically roommates at this point—do they pay rent for living in your headphones?`,
      `If ${artistName} ever checks their streaming royalties, at least half of their coffee budget is coming directly from you.`,
      `Loyal to ${artistName} to a fault. Your Spotify algorithm gave up trying to recommend new ${gLower || 'music'} months ago.`,
    ];
    return templates[variant % templates.length];
  }

  const templates = [
    `You stream ${artistName} like you're getting paid per listen, yet somehow still act mysterious when someone asks for the aux cord.`,
    `Having ${artistName} this high in your rotation is the audio equivalent of ordering plain buttered noodles at a five-star restaurant.`,
    `${artistName} is carrying your entire personality on their back right now, and frankly their knees are buckling.`,
    `Nobody—and I mean nobody—needs this much ${artistName} unless they are actively trying to star in an imaginary music video on public transit.`,
  ];
  return templates[variant % templates.length];
}

function buildRoast(stats: ListeningStats, tone: RoastTone, shuffleIndex: number): RoastCardData {
  const topArtist1 = stats.topArtists[0]?.name || 'Unknown Artist';
  const topArtist2 = stats.topArtists[1]?.name || 'your #2 artist';
  const topArtist3 = stats.topArtists[2]?.name || 'your #3 artist';
  const topTrack1 = stats.topTracks[0];
  const topTrack2 = stats.topTracks[1];
  const topAlbum1 = stats.topAlbums[0];
  const topGenre1 = stats.topGenres[0]?.name || 'Pop';
  const topGenre2 = stats.topGenres[1]?.name || 'Indie';

  const popTracks = stats.topTracks.filter((t) => typeof t.popularity === 'number');
  const avgPopularity =
    popTracks.length > 0
      ? Math.round(popTracks.reduce((acc, t) => acc + (t.popularity || 65), 0) / popTracks.length)
      : 68;

  const seed = hashSeed(`${topArtist1}:${topTrack1?.name || ''}:${tone}:${shuffleIndex}`);

  const headlinesByTone: Record<RoastTone, string[]> = {
    ruthless: [
      `Main-Character Delusion Powered by ${topArtist1}`,
      `Terminal ${topGenre1} Fixation`,
      `An Aux-Cord Liability Wrapped in ${topArtist1}`,
      `Algorithmically Trapped in a ${topArtist1} Time Loop`,
    ],
    pitchfork: [
      `A Derivative Exercise in Mid-Tempo ${topGenre1} Nostalgia (3.8/10)`,
      `Uninspired ${topArtist1} Worship Masquerading as Taste`,
      `Sonic Wallpaper for the Chronically Online`,
      `Over-Indexed on ${topGenre1}, Under-Indexed on Originality`,
    ],
    therapist: [
      `Clinical Attachment to ${topArtist1} & Unprocessed Nostalgia`,
      `Using "${topTrack1?.name || topArtist1}" as a Coping Mechanism`,
      `High-Functioning ${topGenre1} Dependency`,
      `Dopamine-Seeking Repeat Syndrome`,
    ],
    mild: [
      `Certified ${topArtist1} Super-Sponsor`,
      `Creature of Comfort & ${topGenre1} Loyalist`,
      `Predictably Obsessed with ${topArtist1}`,
      `Your Headphones Only Know 3 Artists`,
    ],
  };

  const headline = headlinesByTone[tone][seed % headlinesByTone[tone].length];

  const subheadline =
    avgPopularity >= 72
      ? `Your music taste is ${avgPopularity}% mainstream—Spotify's algorithm doesn't even have to try with you.`
      : avgPopularity <= 45
      ? `Only ${avgPopularity}% mainstream—you definitely gatekeep bands with 400 monthly listeners.`
      : `Sitting at ${avgPopularity}% mainstream: too basic for the underground, too weird for the party aux.`;

  const tasteRatings: Record<RoastTone, string[]> = {
    ruthless: ['2.5 / 10 (AUX REVOKED)', '3.1 / 10 (CRITICAL)', '1.9 / 10 (HAZARD)'],
    pitchfork: ['3.4 / 10 (LIGHT PAN)', '4.1 / 10 (DERIVATIVE)', '2.8 / 10 (PEDESTRIAN)'],
    therapist: ['3 SESSIONS / WEEK', 'LOOPING TRACK #1', 'AVOIDANT QUEUE'],
    mild: ['6.8 / 10 (PREDICTABLE)', '7.2 / 10 (CREATURE OF HABIT)', '6.4 / 10 (SAFE AUX)'],
  };
  const tasteRating = tasteRatings[tone][seed % tasteRatings[tone].length];

  const redFlags = [
    `Plays "${topTrack1?.name || 'the same song'}" until everyone in the car dissociates`,
    `Thinks listening to ${topArtist1} and ${topArtist2} back-to-back counts as "eclectic taste"`,
    `Peak listening at ${formatHourLabel(stats.peakHour)} like a nocturnal menace`,
    `Refuses to move on from "${topAlbum1?.name || topArtist1}"`,
  ];
  const redFlagLevel = redFlags[seed % redFlags.length];

  const monologues: Record<RoastTone, string> = {
    ruthless: `I looked at your Spotify expecting a personality, and instead I found a shrine to ${topArtist1}, ${topArtist2}, and ${topArtist3}. Between your obsession with "${topTrack1?.name || 'your #1 song'}" and your heavy ${topGenre1} rotation, your Spotify looks like you found 15 songs that gave you a crumb of serotonin once and decided to never evolve again.`,
    pitchfork: `At first glance, pairing ${topArtist1} with ${topArtist2} attempts to project curatorial range across ${topGenre1} and ${topGenre2}. In practice, however, anchoring your rotation on "${topTrack1?.name || 'your top track'}" betrays an algorithmically spoon-fed comfort zone that mistakes familiarity for depth.`,
    therapist: `Let's unpack what's happening here. When someone leans this heavily on ${topArtist1} and ${topArtist2}—especially replaying "${topTrack1?.name || 'the same track'}"—it usually signals a need for emotional predictability. You aren't just listening to ${topGenre1}; you're building a safe room out of ${topAlbum1?.name || 'familiar hooks'}.`,
    mild: `Well, one thing is certain: if ${topArtist1} and ${topArtist2} ever go on tour together, you're buying front-row tickets. Between "${topTrack1?.name || 'your top song'}" and your love for ${topGenre1}, you know exactly what you like—and you refuse to let anyone tell you otherwise.`,
  };

  const artistRoasts = stats.topArtists.slice(0, 3).map((a, idx) => ({
    artist: a.name,
    coverUrl: a.coverUrl,
    line: getSpecificArtistJab(a.name, a.genres[0] || topGenre1, tone, seed + idx),
  }));

  const trackRoast = topTrack1
    ? tone === 'therapist'
      ? `Your #1 song is "${topTrack1.name}" by ${topTrack1.artist}${
          topTrack2 ? `, followed closely by "${topTrack2.name}"` : ''
        }. Replaying the exact same 3-minute audio file over and over is how your brain avoids uncertainty.`
      : tone === 'pitchfork'
      ? `Making "${topTrack1.name}" (${topTrack1.album}) your defining anthem—backed up by "${
          topTrack2?.name || 'track #2'
        }"—is the sonic equivalent of framing a movie poster in a dorm room.`
      : `Your #1 track is "${topTrack1.name}" by ${topTrack1.artist}${
          topTrack2 ? ` and your #2 is "${topTrack2.name}"` : ''
        }. Be honest: how many times did you stare out a window pretending you were in the opening credits of a movie while playing this?`
    : 'Even your top tracks are hiding from judgement.';

  const genreRoast = `Your top genres are ${stats.topGenres
    .slice(0, 3)
    .map((g) => g.name)
    .join(', ')}. ${
    topAlbum1
      ? `And your #1 album is "${topAlbum1.name}" by ${topAlbum1.artist}—which you treat like a sacred text instead of an album.`
      : ''
  }`;

  const hr = stats.peakHour;
  const clockRoast =
    hr >= 0 && hr <= 4
      ? `Your peak listening hour is ${formatHourLabel(hr)}. Nothing good ever happens in a Spotify queue at ${formatHourLabel(hr)}—that is prime ceiling-staring, overthinking-every-life-choice territory.`
      : hr >= 5 && hr <= 9
      ? `Your peak listening hour is ${formatHourLabel(hr)}. Using ${topArtist1} to survive morning commutes is bleak, even for you.`
      : hr >= 10 && hr <= 17
      ? `Your peak listening hour is ${formatHourLabel(hr)}—meaning you use ${topArtist1} and ${topGenre1} to dissociate during work/study hours.`
      : `Your peak listening hour is ${formatHourLabel(hr)}—prime time for dramatic evening main-character syndrome.`;

  const prescriptions: Record<RoastTone, string> = {
    ruthless: `PRESCRIPTION: Step away from ${topArtist1} for 48 hours, stop replaying "${topTrack1?.name || 'Track #1'}", and touch some grass.`,
    pitchfork: `PRESCRIPTION: Delete 60% of your ${topGenre1} queue and listen to an album recorded before 2015 without checking reviews first.`,
    therapist: `PRESCRIPTION: Journal for 10 minutes the next time you feel the urge to queue "${topTrack1?.name || topArtist1}" at ${formatHourLabel(hr)}.`,
    mild: `PRESCRIPTION: Keep enjoying ${topArtist1}, maybe sneak in one new genre this week just to surprise your algorithm.`,
  };

  return {
    headline,
    subheadline,
    tasteRating,
    basicScore: avgPopularity,
    redFlagLevel,
    openingMonologue: monologues[tone],
    artistRoasts,
    trackRoast,
    genreRoast,
    clockRoast,
    prescription: prescriptions[tone],
  };
}

export const SpotifyRoast: React.FC<Props> = ({ stats }) => {
  const [tone, setTone] = useState<RoastTone>('ruthless');
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const roast = useMemo(
    () => buildRoast(stats, tone, shuffleIndex),
    [stats, tone, shuffleIndex]
  );

  const handleCopyRoast = () => {
    const text = [
      `SPOTIFY ROAST - ${stats.userName}`,
      `Verdict: ${roast.headline}`,
      `Rating: ${roast.tasteRating} | Mainstream Score: ${roast.basicScore}%`,
      `Biggest Red Flag: ${roast.redFlagLevel}`,
      ``,
      roast.openingMonologue,
      ``,
      ...roast.artistRoasts.map((a, i) => `#${i + 1} ${a.artist}: ${a.line}`),
      ``,
      roast.trackRoast,
      roast.prescription,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRoastPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flat Canvas Composition
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1350);

    // Top-left Red Block
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(36, 36, 680, 120);

    // Top-right Yellow Block
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(716, 36, 328, 120);

    // Bottom-right Blue Block
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(716, 1170, 328, 144);

    // Bottom-left Yellow Strip
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(36, 1170, 680, 144);

    // Outer & Inner Black Grid Lines
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 10;
    ctx.strokeRect(36, 36, 1008, 1278);

    ctx.beginPath();
    ctx.moveTo(36, 156);
    ctx.lineTo(1044, 156);
    ctx.moveTo(716, 36);
    ctx.lineTo(716, 156);
    ctx.moveTo(36, 1170);
    ctx.lineTo(1044, 1170);
    ctx.moveTo(716, 1170);
    ctx.lineTo(716, 1314);
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px Helvetica, Arial, sans-serif';
    ctx.fillText('SPOTIFY TASTE CRITIQUE', 72, 108);

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText(`${roast.basicScore}% BASIC`, 760, 106);

    // Headline
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 50px Helvetica, Arial, sans-serif';
    wrapCanvasText(ctx, roast.headline, 76, 240, 920, 60);

    ctx.fillStyle = '#808080';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(`SUBJECT: ${stats.userName.toUpperCase()}  |  SCORE: ${roast.tasteRating}`, 76, 385);

    ctx.fillStyle = '#111111';
    ctx.fillRect(76, 415, 928, 4);

    // Monologue
    ctx.fillStyle = '#111111';
    ctx.font = '400 28px Helvetica, Arial, sans-serif';
    wrapCanvasText(ctx, `"${roast.openingMonologue}"`, 76, 475, 920, 40);

    // Artist Indictments
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('[TOP ARTIST INDICTMENTS]', 76, 710);

    let y = 760;
    roast.artistRoasts.slice(0, 3).forEach((ar, i) => {
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 26px Helvetica, Arial, sans-serif';
      ctx.fillText(`0${i + 1} - ${ar.artist}`, 76, y);
      y += 34;
      ctx.fillStyle = '#111111';
      ctx.font = '400 22px Helvetica, Arial, sans-serif';
      y = wrapCanvasText(ctx, ar.line, 76, y, 920, 31) + 26;
    });

    // Prescription in bottom bar
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 21px "JetBrains Mono", monospace';
    wrapCanvasText(ctx, roast.prescription, 64, 1225, 620, 30);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('STATIFY 1917', 760, 1250);

    const link = document.createElement('a');
    link.download = `spotify-roast-${stats.userName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-8 animate-fade-enter">
      {/* Asymmetric Top Header Block (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        <div className="lg:col-span-8 p-5 sm:p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111] bg-[#FF0000] text-[#FFFFFF]">
          <div className="inline-flex items-center gap-2 border border-[#111111] bg-[#111111] text-[#FFFF00] px-3 py-1 font-mono text-xs font-bold uppercase mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>[SPOTIFY TASTE CRITIQUE]</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            How Bad Is Your Spotify?
          </h2>
          <p className="text-xs sm:text-sm text-[#FFFFFF] mt-2 max-w-2xl">
            Structural critique of your actual Top Artists, Top Tracks, Genres, and Circadian Listening Axis.
          </p>
        </div>

        <div className="lg:col-span-4 p-5 sm:p-6 bg-[#FFFF00] flex flex-col justify-between gap-4">
          <span className="font-mono text-xs font-bold uppercase text-[#111111]">
            [ACTIONS & EXPORT]
          </span>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setShuffleIndex((i) => i + 1)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] px-4 py-2.5 text-xs font-bold text-[#111111] transition-colors duration-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>GENERATE NEW VERDICT</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyRoast}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] px-3 py-2.5 text-xs font-bold text-[#111111] transition-colors duration-200 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY TEXT'}</span>
              </button>

              <button
                onClick={handleDownloadRoastPng}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#111111] bg-[#0000FF] hover:bg-[#111111] px-3 py-2.5 text-xs font-bold text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>POSTER PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tone Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        {[
          { id: 'ruthless', label: 'RUTHLESS', icon: Skull, activeBg: 'bg-[#FF0000] text-[#FFFFFF]' },
          { id: 'pitchfork', label: 'SNOBBY CRITIC', icon: Glasses, activeBg: 'bg-[#0000FF] text-[#FFFFFF]' },
          { id: 'therapist', label: 'THERAPIST', icon: HeartCrack, activeBg: 'bg-[#FFFF00] text-[#111111]' },
          { id: 'mild', label: 'GENTLE', icon: Sparkles, activeBg: 'bg-[#111111] text-[#FFFFFF]' },
        ].map((item) => {
          const Icon = item.icon;
          const active = tone === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTone(item.id as RoastTone)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border-2 border-[#111111] px-3 sm:px-4 py-2 font-mono text-xs font-bold transition-transform duration-200 active:-translate-y-0.5 cursor-pointer shrink-0 ${
                active
                  ? item.activeBg
                  : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFFF00]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Asymmetric Verdict Grid (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        <div className="lg:col-span-8 p-4 sm:p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111] space-y-4 sm:space-y-6">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#0000FF]">
              [THE VERDICT]
            </span>
            <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#111111] mt-2 leading-tight break-words">
              &ldquo;{roast.headline}&rdquo;
            </h3>
            <p className="text-xs sm:text-sm text-[#808080] mt-2 font-mono break-words">{roast.subheadline}</p>
          </div>

          <div className="border-l-4 border-[#FF0000] bg-[#FFFFFF] pl-3.5 sm:pl-5 py-2">
            <p className="text-sm sm:text-base text-[#111111] leading-relaxed break-words">
              {roast.openingMonologue}
            </p>
          </div>

          <div className="border-2 border-[#111111] bg-[#FFFF00] p-3.5 sm:p-4 flex items-start gap-3">
            <Flame className="w-5 h-5 text-[#FF0000] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-mono text-[10px] sm:text-xs font-bold uppercase text-[#111111] block">
                BIGGEST LISTENING HABIT
              </span>
              <p className="text-sm font-bold text-[#111111] mt-0.5 break-words">{roast.redFlagLevel}</p>
            </div>
          </div>
        </div>

        {/* Right 4-Col Telemetry & Score Stack */}
        <div className="lg:col-span-4 flex flex-col justify-between divide-y-2 divide-[#111111]">
          <div className="p-4 sm:p-6 bg-[#0000FF] text-[#FFFFFF]">
            <span className="font-mono text-xs uppercase tracking-widest block opacity-80">
              [TASTE RATING]
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold mt-2 break-words">{roast.tasteRating}</p>
          </div>

          <div className="p-4 sm:p-6 bg-[#FFFFFF]">
            <span className="font-mono text-xs uppercase tracking-widest text-[#808080] block">
              [MAINSTREAM SCORE]
            </span>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
              {roast.basicScore}% MAINSTREAM
            </p>
            <div className="mt-3 h-4 w-full border-2 border-[#111111] bg-[#FFFFFF]">
              <div
                style={{ width: `${roast.basicScore}%` }}
                className="h-full bg-[#FF0000] border-r-2 border-[#111111]"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-[#111111] text-[#FFFFFF]">
            <span className="font-mono text-xs uppercase tracking-widest text-[#FFFF00] block">
              [THE RECOMMENDATION]
            </span>
            <p className="font-mono text-xs leading-relaxed mt-2 break-words">{roast.prescription}</p>
          </div>
        </div>
      </div>

      {/* Asymmetric Artist Indictments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        {/* #1 Artist Featured Indictment (5 cols) */}
        {roast.artistRoasts[0] && (
          <div className="lg:col-span-5 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111] bg-[#FFFF00] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
                <span className="font-mono text-xs font-bold uppercase text-[#111111] flex items-center gap-1.5 truncate pr-2">
                  <Mic2 className="w-4 h-4 text-[#FF0000] shrink-0" />
                  <span className="truncate">[YOUR #1 ARTIST]</span>
                </span>
                <span className="font-mono text-xs font-bold bg-[#111111] text-[#FFFFFF] px-2 py-0.5 shrink-0">
                  #1
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 my-4">
                <img
                  src={roast.artistRoasts[0].coverUrl}
                  alt={roast.artistRoasts[0].artist}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-[#111111] shrink-0"
                />
                <h4 className="text-xl sm:text-2xl font-bold text-[#111111] truncate min-w-0">
                  {roast.artistRoasts[0].artist}
                </h4>
              </div>
            </div>
            <p className="text-sm font-medium text-[#111111] leading-relaxed border-t-2 border-[#111111] pt-3 break-words">
              {roast.artistRoasts[0].line}
            </p>
          </div>
        )}

        {/* #2 & #3 Artists Stacked (7 cols) */}
        <div className="lg:col-span-7 divide-y-2 divide-[#111111]">
          {roast.artistRoasts.slice(1, 3).map((item, idx) => (
            <div key={item.artist} className="p-4 sm:p-6 bg-[#FFFFFF] flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
              <img
                src={item.coverUrl}
                alt={item.artist}
                className="w-12 h-12 sm:w-14 sm:h-14 object-cover border-2 border-[#111111] shrink-0"
              />
              <div className="min-w-0 flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-base sm:text-lg font-bold text-[#111111] truncate min-w-0">{item.artist}</h5>
                  <span className="font-mono text-xs font-bold bg-[#0000FF] text-[#FFFFFF] px-2 py-0.5 border border-[#111111] shrink-0">
                    #{idx + 2} ARTIST
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#111111] mt-2 leading-relaxed break-words">{item.line}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asymmetric Breakdown Row (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-[#111111] bg-[#FFFFFF]">
        <div className="lg:col-span-7 p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#111111] space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#FF0000]">
            <Music2 className="w-4 h-4" />
            <span>[SONG REPEATS]</span>
          </div>
          <p className="text-xs sm:text-sm text-[#111111] leading-relaxed">{roast.trackRoast}</p>
          <div className="pt-3 border-t border-[#111111]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#0000FF] mb-1">
              <Disc3 className="w-4 h-4" />
              <span>[YOUR GENRES]</span>
            </div>
            <p className="text-xs sm:text-sm text-[#808080] leading-relaxed">{roast.genreRoast}</p>
          </div>
        </div>

        <div className="lg:col-span-5 p-4 sm:p-6 bg-[#111111] text-[#FFFFFF] flex flex-col justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#FFFF00]">
            <Clock className="w-4 h-4" />
            <span>[LISTENING HOURS]</span>
          </div>
          <p className="text-sm leading-relaxed my-4">{roast.clockRoast}</p>
          <div className="h-3 w-full bg-[#FF0000] border border-[#FFFFFF]" />
        </div>
      </div>
    </div>
  );
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currY);
      line = words[n] + ' ';
      currY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currY);
  }
  return currY;
}
