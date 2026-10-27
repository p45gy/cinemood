const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Load initial catalog
const catalogPath = path.join(__dirname, 'data', 'catalog.json');
const userStatePath = path.join(__dirname, 'data', 'user_state.json');

let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// Initialize or load user state
let userState = {
  favorites: catalog.initialFavorites || [],
  history: catalog.userProfile?.history || [],
  profile: catalog.userProfile || {}
};

if (fs.existsSync(userStatePath)) {
  try {
    const saved = JSON.parse(fs.readFileSync(userStatePath, 'utf-8'));
    userState = { ...userState, ...saved };
  } catch (err) {
    console.error('Error loading user_state.json:', err);
  }
}

function saveUserState() {
  try {
    fs.writeFileSync(userStatePath, JSON.stringify(userState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving user_state.json:', err);
  }
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'CineMood (Cur the Mood)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Predefined moods
app.get('/api/moods', (req, res) => {
  const summaries = catalog.moods.map(m => ({
    id: m.id,
    name: m.name,
    badge: m.badge,
    tagline: m.tagline,
    summary: m.summary,
    icon: m.icon,
    colorClass: m.colorClass,
    bgClass: m.bgClass,
    shadowClass: m.shadowClass,
    themeColor: m.themeColor,
    accentColor: m.accentColor,
    movieCount: m.movies.length,
    topMovie: m.movies[0]?.title || '',
    playlistTitle: m.playlist?.title || ''
  }));
  res.json(summaries);
});

// 3. Single mood curation details
app.get('/api/curations/:moodId', (req, res) => {
  const mood = catalog.moods.find(m => m.id === req.params.moodId);
  if (!mood) {
    return res.status(404).json({ error: 'Mood not found' });
  }
  res.json(mood);
});

// 4. Surprise me
app.get('/api/surprise', (req, res) => {
  const randomIndex = Math.floor(Math.random() * catalog.moods.length);
  const mood = catalog.moods[randomIndex];
  res.json(mood);
});

// 5. Trending combos
app.get('/api/trending', (req, res) => {
  res.json(catalog.trendingCombos || []);
});

// 6. Search & Explore
app.get('/api/explore', (req, res) => {
  const { q, vibe, platform } = req.query;
  let movies = [];
  let playlists = [];

  // Gather all movies and playlists from catalog
  catalog.moods.forEach(m => {
    m.movies.forEach(mov => {
      movies.push({ ...mov, moodId: m.id, moodName: m.name });
    });
    if (m.playlist) {
      playlists.push({ ...m.playlist, moodId: m.id, moodName: m.name });
    }
  });

  // Filter by query
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    movies = movies.filter(mov => 
      mov.title.toLowerCase().includes(term) ||
      mov.genre.toLowerCase().includes(term) ||
      mov.synopsis.toLowerCase().includes(term) ||
      mov.moodName.toLowerCase().includes(term)
    );
    playlists = playlists.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.artist.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.moodName.toLowerCase().includes(term)
    );
  }

  // Filter by vibe chip
  if (vibe && vibe !== 'all') {
    const vibeTerm = vibe.toLowerCase();
    movies = movies.filter(mov => 
      mov.moodName.toLowerCase().includes(vibeTerm) ||
      mov.genre.toLowerCase().includes(vibeTerm)
    );
  }

  // Filter by platform
  if (platform && platform !== 'all') {
    const platTerm = platform.toLowerCase();
    movies = movies.filter(mov => 
      mov.streamPlatform.toLowerCase().includes(platTerm)
    );
  }

  res.json({
    query: { q, vibe, platform },
    movies,
    playlists,
    trending: catalog.trendingCombos
  });
});

// 7. Custom Mood Mixer AI Live Preview
app.post('/api/mixer/preview', (req, res) => {
  const { emotion, tempo = 45, visualTone = 30, nostalgia = 70, platforms = [] } = req.body;

  // Curated database of emotion archetypes
  const presets = {
    'Rainy & Reflective': {
      title: 'Midnight in Paris + Ambient Rain Waltz',
      tagline: 'Warm amber lighting, wistful reflections & slow acoustics.',
      vibe: 'Golden Hour Dreamscape',
      movieTitle: 'Midnight in Paris',
      movieYear: '2011',
      moviePlatform: 'Criterion',
      trackTitle: 'Midnight Teahouse (Slowed)',
      artist: 'Komorebi Dream Band',
      tags: ['#35mmFilm', '#LoFiSlowed', '#RainyAesthetic'],
      baseScore: 95,
      ambientType: 'rain',
      explanation: 'The gentle pitter-patter of rain dampens sympathetic nervous system arousal, while warm Parisian amber reflections harmonize with slow waltz cadences.'
    },
    'Electric Night': {
      title: 'Blade Runner 2049 + Neon Darkwave',
      tagline: 'Gleaming wet asphalt, towering holographic silhouettes & analog synth.',
      vibe: 'Cyber Velvet Ignition',
      movieTitle: 'Blade Runner 2049',
      movieYear: '2017',
      moviePlatform: 'Netflix',
      trackTitle: 'Neon Driftways (Overdrive)',
      artist: 'Kavinsky & Daft Punk Echo',
      tags: ['#Cyberpunk', '#Synthwave', '#NightDrive'],
      baseScore: 96,
      ambientType: 'synth_pulse',
      explanation: 'Driving bass frequencies combined with high-contrast neon hues activate dopaminergic pathways for intense immersive flow.'
    },
    'Sunday Sloth': {
      title: 'My Neighbor Totoro + Afternoon Lo-Fi',
      tagline: 'Sunlit tatami mats, peaceful meadow breezes & soft Rhodes keys.',
      vibe: 'Pastoral Cloud Sloth',
      movieTitle: 'My Neighbor Totoro',
      movieYear: '1988',
      moviePlatform: 'Netflix',
      trackTitle: 'Catbus Afternoon Nap',
      artist: 'ChilledCow Lo-Fi Archives',
      tags: ['#GhibliVibes', '#CozySloth', '#AfternoonTea'],
      baseScore: 98,
      ambientType: 'warm_drone',
      explanation: 'Slow, predictable melodic structures paired with nostalgic watercolor landscapes gently lower heart rate and reduce stress.'
    },
    'Bitter Sweet': {
      title: 'Lost in Translation + Melancholy Shimmer',
      tagline: 'Whispered hotel lounge confidences and blurred rainy city lights.',
      vibe: 'Midnight Tokyo Shimmer',
      movieTitle: 'Lost in Translation',
      movieYear: '2003',
      moviePlatform: 'Hulu',
      trackTitle: 'Pale Hotel Horizon',
      artist: 'Air & My Bloody Valentine Ambient',
      tags: ['#Melancholy', '#TokyoRain', '#ShoegazeVibe'],
      baseScore: 94,
      ambientType: 'tape_hiss',
      explanation: 'Complex minor-seventh chords evoke cathartic tears that stimulate endorphin release, leaving you grounded and gently comforted.'
    },
    'Stargazing': {
      title: 'Interstellar + Cosmic Ambient Blanket',
      tagline: 'Infinite stellar horizons, ticking clocks & ethereal synth pads.',
      vibe: 'Astral Echoes',
      movieTitle: 'Interstellar',
      movieYear: '2014',
      moviePlatform: 'Prime',
      trackTitle: 'Mountains of Starlight',
      artist: 'Hans Zimmer & Brian Eno Space Ensemble',
      tags: ['#CosmicWonder', '#AmbientSpace', '#MindExpansion'],
      baseScore: 97,
      ambientType: 'warm_drone',
      explanation: 'Reverberant acoustic spaces mirror oceanic expanse, triggering awe responses in the brain that diminish self-focused anxiety.'
    },
    'Warm Chai': {
      title: 'Fantastic Mr. Fox + Acoustic Hearth',
      tagline: 'Cardigan weather, cider toast, and finger-picked folk guitar.',
      vibe: 'Autumn Corduroy Harmony',
      movieTitle: 'Fantastic Mr. Fox',
      movieYear: '2009',
      moviePlatform: 'Criterion',
      trackTitle: 'Cider Cellar Waltz',
      artist: 'Alexandre Desplat & Nick Drake Trio',
      tags: ['#AutumnWarmth', '#IndieFolk', '#CardiganSeason'],
      baseScore: 96,
      ambientType: 'vinyl_crackle',
      explanation: 'Analog vinyl crackle frequencies coupled with warm wood tones simulate fireside sensory cues that activate the parasympathetic nervous system.'
    }
  };

  const selectedPreset = presets[emotion] || presets['Rainy & Reflective'];

  // Calculate dynamic resonance match score based on slider balances
  const tempoDelta = Math.abs(tempo - 45);
  const toneDelta = Math.abs(visualTone - 30);
  const nostalgiaDelta = Math.abs(nostalgia - 70);
  const penalty = Math.round((tempoDelta + toneDelta + nostalgiaDelta) / 30);
  const matchScore = Math.min(99, Math.max(88, selectedPreset.baseScore - penalty + Math.floor(Math.random() * 3)));

  res.json({
    emotion: emotion || 'Rainy & Reflective',
    vibeTitle: selectedPreset.vibe,
    tagline: selectedPreset.tagline,
    matchScore: `${matchScore}%`,
    tempoBPM: `${Math.round(40 + (tempo / 100) * 80)} BPM`,
    visualToneText: visualTone < 40 ? 'Warm 35mm Grain' : visualTone < 70 ? 'Balanced Pastel' : 'Neon Cyber Velvet',
    nostalgiaText: `${nostalgia}% Vintage`,
    movie: {
      title: selectedPreset.movieTitle,
      year: selectedPreset.movieYear,
      platform: platforms.length > 0 ? platforms[0] : selectedPreset.moviePlatform,
      poster: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3JQV0rL1FHtfRFJjmQ2vQKbawKiipRM-ayLu_b1bDEX96TLtFdmiBQe4BojXZzxFoEqty6CqyPSo0huimRMpUXwn_07MWtpZM2g6xkHkVDcnR0s45vVrOTKULnGR6ZdntEiFwn_oVyfLerLLsJ7nNnXZ4v6vjRCLVaT2zDatrJJa6_SU16RI4xKkyt2O-EROwoKXjQ17plybTFkoqK3yzkO95oKHc_Svfxmr1zqcDCRTRVgggN71-'
    },
    audio: {
      title: selectedPreset.trackTitle,
      artist: selectedPreset.artist,
      duration: '0:24',
      ambientType: selectedPreset.ambientType
    },
    tags: selectedPreset.tags,
    neuroExplanation: selectedPreset.explanation
  });
});

// 8. Favorites endpoints
app.get('/api/favorites', (req, res) => {
  res.json(userState.favorites);
});

app.post('/api/favorites', (req, res) => {
  const item = req.body;
  if (!item || !item.title) {
    return res.status(400).json({ error: 'Invalid item' });
  }
  const id = item.id || `fav-${Date.now()}`;
  const exists = userState.favorites.some(f => f.title === item.title);
  if (!exists) {
    userState.favorites.unshift({ ...item, id, addedAt: new Date().toISOString() });
    saveUserState();
  }
  res.json({ success: true, favorites: userState.favorites });
});

app.delete('/api/favorites/:id', (req, res) => {
  const { id } = req.params;
  userState.favorites = userState.favorites.filter(f => f.id !== id);
  saveUserState();
  res.json({ success: true, favorites: userState.favorites });
});

// 9. User profile & History
app.get('/api/profile', (req, res) => {
  res.json({
    ...userState.profile,
    favoritesCount: userState.favorites.length,
    historyCount: userState.history.length,
    history: userState.history
  });
});

app.post('/api/history', (req, res) => {
  const session = req.body;
  const newEntry = {
    id: `h-${Date.now()}`,
    date: 'Just now',
    mood: session.mood || 'Rainy Day',
    movie: session.movie || 'Midnight in Paris',
    audio: session.audio || 'Rain on the Window',
    icon: session.icon || 'water_drop',
    liked: session.liked || false,
    timestamp: new Date().toISOString()
  };
  userState.history.unshift(newEntry);
  if (userState.history.length > 25) userState.history.pop();
  saveUserState();
  res.json({ success: true, history: userState.history });
});

// 10. Share card metadata
app.get('/api/share/:moodId', (req, res) => {
  const mood = catalog.moods.find(m => m.id === req.params.moodId) || catalog.moods[0];
  res.json({
    moodId: mood.id,
    moodName: mood.name,
    tagline: mood.summary,
    posters: mood.movies.slice(0, 3).map(m => m.poster),
    playlistCover: mood.playlist?.cover,
    playlistTitle: mood.playlist?.title,
    artist: mood.playlist?.artist,
    themeColor: mood.themeColor,
    accentColor: mood.accentColor,
    shareUrl: `https://cinemood.app/mood/${mood.id}`
  });
});

// Fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎬 CineMood Full-Stack Server running on http://localhost:${PORT}`);
});
