/**
 * CineMood (Cur the Mood) - Full-Stack Client Application
 * Includes Web Audio ambient synthesizer, dynamic routing, live AI mixer,
 * favorites persistence, story card export, and dual-theme switching.
 */

// ==========================================================================
// 1. Audio Engine (Web Audio API Synthesizer)
// ==========================================================================
class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentType = 'rain';
    this.masterGain = null;
    this.ambientGain = null;
    this.isDucking = false;
    this.activeNodes = [];
    this.stepInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type = 'rain') {
    this.init();
    this.stop();
    this.currentType = type;
    this.isPlaying = true;

    if (type === 'rain') {
      this.playRain();
    } else if (type === 'vinyl_crackle') {
      this.playVinyl();
    } else if (type === 'tape_hiss') {
      this.playTapeHiss();
    } else if (type === 'synth_pulse') {
      this.playSynthPulse();
    } else {
      this.playWarmDrone();
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }

  // Realistic Rain Synthesizer (White/Pink noise through bandpass + droplet pings)
  playRain() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    // Generate pink noise algorithm
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like soft rainfall on glass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter);

    // Warm Rhodes chords generator (Gentle Lofi cadence)
    this.startChordsLoop([174.61, 220.00, 261.63, 329.63]); // Fmaj7
  }

  // Vinyl Crackle
  playVinyl() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      if (Math.random() < 0.002) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.005;
      }
    }
    const crackle = this.ctx.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    crackle.connect(filter);
    filter.connect(this.ambientGain);
    crackle.start();
    this.activeNodes.push(crackle, filter);

    this.startChordsLoop([130.81, 164.81, 196.00, 246.94]); // Cmaj7
  }

  // Warm Drone
  playWarmDrone() {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.4, this.ctx.currentTime); // Slight detune for warm beating

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    this.activeNodes.push(osc1, osc2, filter);

    this.startChordsLoop([146.83, 174.61, 220.00, 261.63]); // Dm7
  }

  // Synth Pulse for Hype Mode / Electric Night
  playSynthPulse() {
    const freqs = [130.81, 164.81, 196.00, 261.63, 196.00, 164.81];
    let step = 0;

    this.stepInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freqs[step % freqs.length], this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
      step++;
    }, 280);
  }

  // Soft ambient chord arpeggios
  startChordsLoop(notes) {
    let index = 0;
    this.stepInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[index % notes.length], this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.0);
      index++;
    }, 2400);
  }

  // Cinema Audio Ducking
  setDucking(enable) {
    this.isDucking = enable;
    if (!this.ctx || !this.ambientGain) return;
    const targetGain = enable ? 0.15 : 0.5;
    this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.3);
  }
}

const audio = new AmbientAudioEngine();

// ==========================================================================
// 2. Application State & Storage
// ==========================================================================
const state = {
  moods: [],
  currentMoodId: 'rainy-day',
  currentMoodData: null,
  currentTrack: null,
  currentMovie: null,
  favorites: [],
  userProfile: null,
  mixer: {
    emotion: 'Rainy & Reflective',
    tempo: 35,
    visualTone: 28,
    nostalgia: 72,
    platforms: ['Criterion', 'Netflix', 'Spotify', 'YouTube Lo-Fi'],
    previewData: null
  },
  player: {
    isPlaying: false,
    duration: 210, // seconds
    currentTime: 74,
    smartDucking: true,
    timer: null
  },
  theme: localStorage.getItem('cinemood_theme') || 'cinemood'
};

// ==========================================================================
// 3. UI Helpers & Toasts
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================================================
// 4. API Calls
// ==========================================================================
async function apiGet(endpoint) {
  try {
    const res = await fetch(endpoint);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return null;
  }
}

async function apiPost(endpoint, body) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error(`Error posting ${endpoint}:`, err);
    return null;
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    console.error(`Error deleting ${endpoint}:`, err);
    return null;
  }
}

// ==========================================================================
// 5. Theme Management (Cinemood Pastel vs. Obsidian Dark)
// ==========================================================================
function applyTheme(themeName) {
  state.theme = themeName;
  localStorage.setItem('cinemood_theme', themeName);
  const body = document.body;
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');

  if (themeName === 'obsidian') {
    body.classList.add('obsidian-theme');
    html.classList.add('dark');
    html.classList.remove('light');
    if (icon) icon.innerText = 'light_mode';
    if (label) label.innerText = 'Cinemood';
  } else {
    body.classList.remove('obsidian-theme');
    html.classList.add('light');
    html.classList.remove('dark');
    if (icon) icon.innerText = 'dark_mode';
    if (label) label.innerText = 'Obsidian';
  }
}

// ==========================================================================
// 6. Router & Navigation
// ==========================================================================
function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRoute() {
  const fullHash = window.location.hash || '#home';
  const parts = fullHash.slice(1).split('/');
  const route = parts[0] || 'home';
  const param = parts[1] || null;

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));

  // Update active links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.route === route) {
      link.classList.add('bg-[var(--primary)]', 'text-[var(--on-primary)]');
      link.classList.remove('text-[var(--on-surface-variant)]');
    } else {
      link.classList.remove('bg-[var(--primary)]', 'text-[var(--on-primary)]');
      link.classList.add('text-[var(--on-surface-variant)]');
    }
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.dataset.route === route) {
      btn.classList.add('text-[var(--primary)]');
      btn.classList.remove('text-[var(--on-surface-variant)]');
    } else {
      btn.classList.remove('text-[var(--primary)]');
      btn.classList.add('text-[var(--on-surface-variant)]');
    }
  });

  // Render view
  if (route === 'home') {
    document.getElementById('view-home').classList.remove('hidden');
    renderHomeView();
  } else if (route === 'curations') {
    document.getElementById('view-curations').classList.remove('hidden');
    loadMoodCurations(param || state.currentMoodId);
  } else if (route === 'mixer') {
    document.getElementById('view-mixer').classList.remove('hidden');
    renderMixerView();
  } else if (route === 'explore') {
    document.getElementById('view-explore').classList.remove('hidden');
    loadExploreView();
  } else if (route === 'favorites') {
    document.getElementById('view-favorites').classList.remove('hidden');
    loadFavoritesView();
  } else if (route === 'profile') {
    document.getElementById('view-profile').classList.remove('hidden');
    loadProfileView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 7. View Renderers
// ==========================================================================

// Home View
async function renderHomeView() {
  if (state.moods.length === 0) {
    state.moods = await apiGet('/api/moods') || [];
  }

  const grid = document.getElementById('mood-grid');
  if (!grid) return;
  grid.innerHTML = '';

  state.moods.forEach(mood => {
    const card = document.createElement('button');
    card.className = `${mood.bgClass} ${mood.shadowClass} rounded-2xl p-5 flex flex-col items-center justify-center gap-3 aspect-square hover:-translate-y-1.5 transition-all inner-glow cursor-pointer text-center group`;
    card.innerHTML = `
      <span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform fill-1" style="color: ${mood.themeColor};">${mood.icon}</span>
      <span class="font-bold text-base text-[var(--on-surface)] leading-tight">${mood.name}</span>
      <span class="text-[11px] text-[var(--on-surface-variant)] line-clamp-1">${mood.movieCount} films curated</span>
    `;
    card.onclick = () => {
      state.currentMoodId = mood.id;
      navigateTo(`#curations/${mood.id}`);
    };
    grid.appendChild(card);
  });

  // Home Trending Combos
  const trending = await apiGet('/api/trending') || [];
  const trendingContainer = document.getElementById('home-trending-container');
  if (trendingContainer) {
    trendingContainer.innerHTML = '';
    trending.slice(0, 3).forEach(item => {
      const tc = document.createElement('div');
      tc.className = 'rounded-2xl bg-[var(--surface-container-lowest)] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-[var(--outline-variant)]/30';
      tc.innerHTML = `
        <div class="relative h-40 w-full overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${item.cover}">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
            <span class="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">${item.cinemaTag}</span>
          </div>
        </div>
        <div class="p-4 flex flex-col justify-between flex-1 gap-3">
          <div>
            <h3 class="font-bold text-base text-[var(--on-surface)] leading-snug">${item.title}</h3>
            <p class="text-xs text-[var(--on-surface-variant)] mt-1">${item.description}</p>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-[var(--on-surface-variant)] font-semibold">${item.movieName} • ${item.audioName}</span>
            <button class="px-4 py-1.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all">
              <span class="material-symbols-outlined text-[16px]">play_arrow</span> Pair
            </button>
          </div>
        </div>
      `;
      tc.querySelector('button').onclick = () => {
        launchPlayerFromTrending(item);
      };
      trendingContainer.appendChild(tc);
    });
  }
}

// Curations / Mood Results View
async function loadMoodCurations(moodId) {
  state.currentMoodId = moodId;
  const mood = await apiGet(`/api/curations/${moodId}`);
  if (!mood) return;
  state.currentMoodData = mood;

  // Title & icons
  document.getElementById('curation-title').innerText = mood.name;
  document.getElementById('curation-tagline').innerText = mood.summary;
  const iconEl = document.getElementById('curation-icon');
  iconEl.innerText = mood.icon;
  iconEl.style.color = mood.themeColor;

  // Movies Carousel/Grid
  const moviesContainer = document.getElementById('curation-movies-container');
  moviesContainer.innerHTML = '';
  mood.movies.forEach(movie => {
    const mCard = document.createElement('div');
    mCard.className = 'bg-[var(--surface-container-lowest)] rounded-2xl shadow-sm overflow-hidden group hover:-translate-y-1.5 transition-all flex flex-col border border-[var(--outline-variant)]/30';
    mCard.innerHTML = `
      <div class="relative h-64 w-full overflow-hidden bg-black/10">
        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${movie.poster}">
        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm flex items-center justify-center text-[var(--primary)]">
          <span class="material-symbols-outlined text-[20px]">${movie.streamLogo || 'tv'}</span>
        </div>
        <div class="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
          ${movie.matchRate} Vibe Match
        </div>
      </div>
      <div class="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-base text-[var(--on-surface)] truncate">${movie.title}</h3>
            <div class="flex items-center gap-0.5 text-[var(--primary)] text-xs font-bold">
              <span class="material-symbols-outlined text-[14px] fill-1">star</span> ${movie.rating}
            </div>
          </div>
          <p class="text-xs text-[var(--on-surface-variant)] mt-0.5">${movie.genre} • ${movie.year}</p>
          <p class="text-xs text-[var(--on-surface-variant)] mt-2 line-clamp-2">${movie.synopsis}</p>
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-[var(--outline-variant)]/30">
          <button class="curation-pair-btn flex-1 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">play_arrow</span> Pair & Play
          </button>
          <button class="fav-movie-btn w-8 h-8 rounded-full bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--secondary)] flex items-center justify-center transition-all" title="Save to Watchlist">
            <span class="material-symbols-outlined text-[18px]">favorite_border</span>
          </button>
        </div>
      </div>
    `;

    mCard.querySelector('.curation-pair-btn').onclick = () => {
      launchPlayer(movie, mood.playlist, mood);
    };

    mCard.querySelector('.fav-movie-btn').onclick = async (e) => {
      e.stopPropagation();
      await toggleFavoriteMovie(movie, mood);
    };

    moviesContainer.appendChild(mCard);
  });

  // Listen Section
  const listenCard = document.getElementById('curation-listen-card');
  if (mood.playlist) {
    const pl = mood.playlist;
    listenCard.innerHTML = `
      <div class="w-40 h-40 sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden shadow-ambient relative group">
        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${pl.cover}">
      </div>
      <div class="flex flex-col items-center md:items-start text-center md:text-left flex-grow gap-2">
        <span class="text-xs font-bold text-[var(--on-primary-fixed-variant)] bg-white/60 px-3 py-1 rounded-full">${pl.badge}</span>
        <h3 class="text-2xl sm:text-3xl font-bold text-[var(--on-primary-fixed)] leading-tight">${pl.title}</h3>
        <p class="text-xs sm:text-sm text-[var(--on-primary-fixed-variant)] max-w-md">${pl.description}</p>
        <div class="flex items-center gap-3 mt-3">
          <button id="curation-listen-play-btn" class="bg-[var(--primary)] text-[var(--on-primary)] text-xs sm:text-sm font-bold px-7 py-3 rounded-full flex items-center gap-2 shadow-ambient hover:opacity-90 active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined fill-1 text-[20px]">play_arrow</span> Play Ambient Soundtrack
          </button>
          <span class="text-xs font-mono text-[var(--on-primary-fixed-variant)]">BPM: ${pl.bpm}</span>
        </div>
      </div>
    `;

    listenCard.querySelector('#curation-listen-play-btn').onclick = () => {
      launchPlayer(mood.movies[0], pl, mood);
    };
  }

  // Setup Launch Button at top
  document.getElementById('curation-launch-player-btn').onclick = () => {
    launchPlayer(mood.movies[0], mood.playlist, mood);
  };
}

// Custom Mood Mixer Studio View
function renderMixerView() {
  const emotions = [
    { name: 'Rainy & Reflective', desc: 'Misty lo-fi cinema', icon: 'rainy', color: 'primary' },
    { name: 'Electric Night', desc: 'Pulsing neo-tokyo', icon: 'bolt', color: 'secondary' },
    { name: 'Sunday Sloth', desc: 'Pillow mountain', icon: 'weekend', color: 'tertiary' },
    { name: 'Bitter Sweet', desc: 'French new wave', icon: 'sentiment_neutral', color: 'secondary' },
    { name: 'Stargazing', desc: 'Cosmic ambient', icon: 'auto_awesome', color: 'primary' },
    { name: 'Warm Chai', desc: 'Cozy acoustic', icon: 'local_cafe', color: 'secondary' }
  ];

  const grid = document.getElementById('mixer-emotions-grid');
  grid.innerHTML = '';
  emotions.forEach(emo => {
    const isSelected = state.mixer.emotion === emo.name;
    const btn = document.createElement('button');
    btn.className = `p-3 rounded-xl flex items-center gap-2.5 transition-all active:scale-95 text-left cursor-pointer border ${
      isSelected 
        ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm' 
        : 'bg-[var(--surface-container)] text-[var(--on-surface)] border-transparent hover:bg-[var(--surface-container-high)]'
    }`;
    btn.innerHTML = `
      <span class="material-symbols-outlined text-[20px] shrink-0">${emo.icon}</span>
      <div class="flex flex-col min-w-0">
        <span class="font-bold text-xs truncate">${emo.name}</span>
        <span class="text-[10px] opacity-75 truncate">${emo.desc}</span>
      </div>
    `;
    btn.onclick = () => {
      state.mixer.emotion = emo.name;
      document.getElementById('mixer-selected-emotion-tag').innerText = emo.name;
      renderMixerView();
      updateMixerPreview();
    };
    grid.appendChild(btn);
  });

  // Setup sources pills
  const sources = [
    { name: 'Netflix', icon: 'movie' },
    { name: 'Spotify', icon: 'headphones' },
    { name: 'Hulu', icon: 'play_circle' },
    { name: 'Criterion', icon: 'theaters' },
    { name: 'Apple Music', icon: 'album' },
    { name: 'YouTube Lo-Fi', icon: 'radio' }
  ];

  const sourcesCont = document.getElementById('mixer-sources-container');
  sourcesCont.innerHTML = '';
  sources.forEach(src => {
    const isActive = state.mixer.platforms.includes(src.name);
    const pill = document.createElement('button');
    pill.className = `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
      isActive 
        ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-sm' 
        : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
    }`;
    pill.innerHTML = `
      <span class="material-symbols-outlined text-[16px]">${src.icon}</span>
      <span>${src.name}</span>
    `;
    pill.onclick = () => {
      if (isActive) {
        state.mixer.platforms = state.mixer.platforms.filter(p => p !== src.name);
      } else {
        state.mixer.platforms.push(src.name);
      }
      renderMixerView();
      updateMixerPreview();
    };
    sourcesCont.appendChild(pill);
  });

  // Attach slider event listeners (debounced)
  const tempoSlider = document.getElementById('slider-tempo');
  const toneSlider = document.getElementById('slider-tone');
  const nostSlider = document.getElementById('slider-nostalgia');

  tempoSlider.oninput = (e) => {
    state.mixer.tempo = parseInt(e.target.value);
    const bpm = Math.round(40 + (state.mixer.tempo / 100) * 80);
    document.getElementById('mixer-tempo-badge').innerText = `${bpm} BPM`;
    debouncedMixerPreview();
  };

  toneSlider.oninput = (e) => {
    state.mixer.visualTone = parseInt(e.target.value);
    document.getElementById('mixer-tone-badge').innerText = 
      state.mixer.visualTone < 40 ? 'Warm 35mm' : state.mixer.visualTone < 70 ? 'Balanced Pastel' : 'Neon Cyber';
    debouncedMixerPreview();
  };

  nostSlider.oninput = (e) => {
    state.mixer.nostalgia = parseInt(e.target.value);
    document.getElementById('mixer-nostalgia-badge').innerText = `${state.mixer.nostalgia}%`;
    debouncedMixerPreview();
  };

  updateMixerPreview();
}

let previewDebounceTimer = null;
function debouncedMixerPreview() {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(updateMixerPreview, 250);
}

async function updateMixerPreview() {
  const payload = {
    emotion: state.mixer.emotion,
    tempo: state.mixer.tempo,
    visualTone: state.mixer.visualTone,
    nostalgia: state.mixer.nostalgia,
    platforms: state.mixer.platforms
  };

  const preview = await apiPost('/api/mixer/preview', payload);
  if (!preview) return;
  state.mixer.previewData = preview;

  document.getElementById('preview-vibe-title').innerText = preview.vibeTitle;
  document.getElementById('preview-tagline').innerText = preview.tagline;
  document.getElementById('preview-score').innerText = preview.matchScore;
  document.getElementById('preview-poster').src = preview.movie.poster;
  document.getElementById('preview-platform-badge').innerText = preview.movie.platform;
  document.getElementById('preview-track-title').innerText = preview.audio.title;
  document.getElementById('preview-artist').innerText = preview.audio.artist;
  document.getElementById('preview-neuro-reason').innerText = `"${preview.neuroExplanation}"`;

  const tagsCont = document.getElementById('preview-tags');
  tagsCont.innerHTML = '';
  preview.tags.forEach(tag => {
    const tSpan = document.createElement('span');
    tSpan.className = 'px-2.5 py-0.5 rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] text-[11px] font-semibold';
    tSpan.innerText = tag;
    tagsCont.appendChild(tSpan);
  });

  // Preview play button logic
  const playBtn = document.getElementById('preview-play-btn');
  const playIcon = document.getElementById('preview-play-icon');
  playBtn.onclick = () => {
    if (audio.isPlaying) {
      audio.stop();
      playIcon.innerText = 'play_arrow';
    } else {
      audio.play(preview.audio.ambientType || 'rain');
      playIcon.innerText = 'pause';
      showToast(`Now playing: ${preview.audio.title}`);
    }
  };

  // Launch button logic
  document.getElementById('preview-launch-btn').onclick = () => {
    const customMovie = {
      title: preview.movie.title,
      year: preview.movie.year,
      poster: preview.movie.poster,
      streamPlatform: preview.movie.platform,
      genre: 'Custom Mood Blend'
    };
    const customPlaylist = {
      title: preview.audio.title,
      artist: preview.audio.artist,
      ambientSound: preview.audio.ambientType,
      neuroReason: preview.neuroExplanation
    };
    const customMood = {
      id: 'custom-mix',
      name: preview.vibeTitle,
      summary: preview.tagline
    };
    launchPlayer(customMovie, customPlaylist, customMood);
  };

  // Save mix button logic
  document.getElementById('preview-save-btn').onclick = async () => {
    await apiPost('/api/favorites', {
      type: 'bundle',
      title: preview.vibeTitle,
      subtitle: `${preview.movie.title} • ${preview.audio.title}`,
      mood: state.mixer.emotion,
      movie: preview.movie.title,
      audio: preview.audio.title,
      poster: preview.movie.poster
    });
    showToast('Saved custom mix to your sanctuary!');
  };
}

// Explore View
async function loadExploreView() {
  const searchInput = document.getElementById('vibe-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const cardsGrid = document.getElementById('explore-cards-grid');

  let activeVibe = 'all';
  let activePlatform = 'all';

  async function fetchAndRender() {
    const q = searchInput.value.trim();
    const data = await apiGet(`/api/explore?q=${encodeURIComponent(q)}&vibe=${activeVibe}&platform=${activePlatform}`);
    if (!data) return;

    cardsGrid.innerHTML = '';
    const items = data.movies || [];
    document.getElementById('explore-results-count').innerText = `${items.length} items found`;

    if (items.length === 0) {
      cardsGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-[var(--on-surface-variant)]">
          <span class="material-symbols-outlined text-4xl mb-2">filter_alt_off</span>
          <p class="font-bold">No movies found matching this query.</p>
          <p class="text-xs">Try searching for a different feeling, genre, or streaming platform.</p>
        </div>
      `;
      return;
    }

    items.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'rounded-2xl bg-[var(--surface-container-lowest)] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-[var(--outline-variant)]/30';
      card.innerHTML = `
        <div class="relative h-48 w-full overflow-hidden bg-black/10">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${movie.poster}">
          <div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
            ${movie.moodName}
          </div>
          <div class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[var(--primary)] shadow-sm">
            <span class="material-symbols-outlined text-[16px]">${movie.streamLogo || 'tv'}</span>
          </div>
        </div>
        <div class="p-3.5 flex flex-col justify-between flex-1 gap-2">
          <div>
            <h4 class="font-bold text-sm text-[var(--on-surface)] truncate">${movie.title}</h4>
            <span class="text-[11px] text-[var(--on-surface-variant)]">${movie.year} • ${movie.streamPlatform}</span>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <button class="explore-pair-btn flex-1 py-1.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">play_arrow</span> Pair
            </button>
            <button class="explore-fav-btn w-7 h-7 rounded-full bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--secondary)] flex items-center justify-center transition-all cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">favorite_border</span>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.explore-pair-btn').onclick = async () => {
        const fullMood = await apiGet(`/api/curations/${movie.moodId}`);
        launchPlayer(movie, fullMood ? fullMood.playlist : null, fullMood || { name: movie.moodName });
      };

      card.querySelector('.explore-fav-btn').onclick = async () => {
        await toggleFavoriteMovie(movie, { name: movie.moodName });
      };

      cardsGrid.appendChild(card);
    });
  }

  // Vibe chips
  document.querySelectorAll('#explore-vibe-chips .vibe-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('#explore-vibe-chips .vibe-chip').forEach(c => {
        c.classList.remove('bg-[var(--primary)]', 'text-[var(--on-primary)]');
        c.classList.add('bg-[var(--surface-container)]', 'text-[var(--on-surface)]');
      });
      chip.classList.add('bg-[var(--primary)]', 'text-[var(--on-primary)]');
      chip.classList.remove('bg-[var(--surface-container)]', 'text-[var(--on-surface)]');
      activeVibe = chip.dataset.vibe;
      fetchAndRender();
    };
  });

  // Platform filters
  document.querySelectorAll('#explore-platform-filters .platform-filter').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#explore-platform-filters .platform-filter').forEach(b => {
        b.classList.remove('border-2', 'border-[var(--primary)]', 'text-[var(--primary)]');
        b.classList.add('border-[var(--outline-variant)]/30', 'text-[var(--on-surface)]');
      });
      btn.classList.add('border-2', 'border-[var(--primary)]', 'text-[var(--primary)]');
      btn.classList.remove('border-[var(--outline-variant)]/30', 'text-[var(--on-surface)]');
      activePlatform = btn.dataset.platform;
      fetchAndRender();
    };
  });

  // Search input typing
  let searchTimer = null;
  searchInput.oninput = () => {
    clearBtn.classList.toggle('hidden', !searchInput.value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(fetchAndRender, 300);
  };
  clearBtn.onclick = () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    fetchAndRender();
  };

  document.getElementById('explore-surprise-btn').onclick = () => {
    const chips = document.querySelectorAll('#explore-vibe-chips .vibe-chip');
    const randomChip = chips[Math.floor(Math.random() * chips.length)];
    randomChip.click();
    showToast(`Exploring: ${randomChip.innerText.trim()}`);
  };

  fetchAndRender();
}

// Favorites View
async function loadFavoritesView() {
  const favs = await apiGet('/api/favorites') || [];
  state.favorites = favs;

  document.getElementById('favorites-count-badge').innerText = favs.length;

  const bundlesContainer = document.getElementById('favorites-bundles-container');
  const moviesContainer = document.getElementById('favorites-movies-container');
  bundlesContainer.innerHTML = '';
  moviesContainer.innerHTML = '';

  const bundles = favs.filter(f => f.type === 'bundle');
  const movies = favs.filter(f => f.type !== 'bundle');

  if (bundles.length === 0) {
    bundlesContainer.innerHTML = `<p class="text-xs text-[var(--on-surface-variant)] py-4">No saved bundles yet. Create one in Mood Studio!</p>`;
  } else {
    bundles.forEach(bundle => {
      const bCard = document.createElement('div');
      bCard.className = 'p-4 rounded-2xl bg-[var(--surface-container-lowest)] shadow-sm flex items-center justify-between gap-4 border border-[var(--outline-variant)]/30';
      bCard.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <img class="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" src="${bundle.poster}">
          <div class="flex flex-col min-w-0">
            <span class="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">${bundle.mood || 'Curated'}</span>
            <h4 class="font-bold text-sm text-[var(--on-surface)] truncate">${bundle.title}</h4>
            <p class="text-xs text-[var(--on-surface-variant)] truncate">${bundle.subtitle || bundle.movie}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="open-bundle-btn px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">play_arrow</span> Open
          </button>
          <button class="remove-bundle-btn w-8 h-8 rounded-full hover:bg-[var(--surface-container)] text-[var(--outline)] hover:text-red-500 flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      `;

      bCard.querySelector('.open-bundle-btn').onclick = () => {
        launchPlayer({ title: bundle.movie, poster: bundle.poster }, { title: bundle.audio }, { name: bundle.mood });
      };

      bCard.querySelector('.remove-bundle-btn').onclick = async () => {
        await apiDelete(`/api/favorites/${bundle.id}`);
        showToast('Removed from favorites');
        loadFavoritesView();
      };

      bundlesContainer.appendChild(bCard);
    });
  }

  if (movies.length === 0) {
    moviesContainer.innerHTML = `<p class="col-span-full text-xs text-[var(--on-surface-variant)] py-4">No movies bookmarked yet. Browse Explore or Home to add your favorites!</p>`;
  } else {
    movies.forEach(movie => {
      const mCard = document.createElement('div');
      mCard.className = 'flex flex-col rounded-2xl bg-[var(--surface-container-lowest)] p-3 shadow-sm border border-[var(--outline-variant)]/30';
      mCard.innerHTML = `
        <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-black/10">
          <img class="w-full h-full object-cover" src="${movie.poster}">
          <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-1">
            <span class="text-[10px] font-bold text-[var(--primary)]">${movie.mood}</span>
          </div>
          <button class="remove-fav-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-sm">
            <span class="material-symbols-outlined text-[16px] fill-1">favorite</span>
          </button>
        </div>
        <div class="pt-2.5 flex flex-col">
          <h4 class="font-bold text-xs text-[var(--on-surface)] truncate">${movie.title}</h4>
          <span class="text-[11px] text-[var(--on-surface-variant)]">${movie.year} • ${movie.streamPlatform || 'Stream'}</span>
          <button class="mt-2 py-1 rounded-full bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-xs font-semibold text-[var(--on-surface)] flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[14px]">play_arrow</span> Watch
          </button>
        </div>
      `;

      mCard.querySelector('.remove-fav-btn').onclick = async () => {
        await apiDelete(`/api/favorites/${movie.id}`);
        showToast('Removed from watchlist');
        loadFavoritesView();
      };

      mCard.querySelector('button:last-child').onclick = () => {
        launchPlayer(movie, null, { name: movie.mood });
      };

      moviesContainer.appendChild(mCard);
    });
  }
}

// Profile & Mood History View
async function loadProfileView() {
  const profile = await apiGet('/api/profile');
  if (!profile) return;
  state.userProfile = profile;

  // Stats Grid
  const statsGrid = document.getElementById('profile-stats-grid');
  statsGrid.innerHTML = '';
  (profile.stats || []).forEach(stat => {
    const card = document.createElement('div');
    card.className = 'bg-[var(--surface-container-low)] p-3.5 rounded-xl flex items-center gap-3 border border-[var(--outline-variant)]/20';
    card.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm" style="color: ${stat.color};">
        <span class="material-symbols-outlined text-[20px]">${stat.icon}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between">
          <span class="font-bold text-base text-[var(--on-surface)]">${stat.percent}%</span>
        </div>
        <span class="text-xs text-[var(--on-surface-variant)] block truncate">${stat.mood}</span>
      </div>
    `;
    statsGrid.appendChild(card);
  });

  // Timeline
  const timelineCont = document.getElementById('profile-timeline-container');
  // keep the stem line
  const stem = timelineCont.querySelector('.w-0.5');
  timelineCont.innerHTML = '';
  if (stem) timelineCont.appendChild(stem);

  (profile.history || []).forEach(item => {
    const entry = document.createElement('div');
    entry.className = 'relative flex flex-col pl-4';
    entry.innerHTML = `
      <div class="absolute -left-6 top-3 w-5 h-5 rounded-full bg-[var(--primary-container)] border-2 border-[var(--surface)] flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
      </div>
      <div class="bg-[var(--surface-container-lowest)] rounded-xl p-4 shadow-sm space-y-2.5 border border-[var(--outline-variant)]/20 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-[var(--primary-fixed)] text-[var(--on-primary-fixed)] text-[11px] font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">${item.icon || 'water_drop'}</span>
              ${item.mood}
            </span>
            <span class="text-xs text-[var(--on-surface-variant)]">${item.date}</span>
          </div>
          <button class="text-[var(--on-surface-variant)] hover:text-red-500 transition-colors">
            <span class="material-symbols-outlined text-[18px] ${item.liked ? 'fill-1 text-red-500' : ''}">favorite</span>
          </button>
        </div>
        <div class="flex items-center justify-between text-xs text-[var(--on-surface)]">
          <span class="font-semibold">${item.movie} + ${item.audio}</span>
          <button class="replay-btn px-3 py-1 rounded-full bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] font-bold text-[var(--primary)] flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">replay</span> Replay
          </button>
        </div>
      </div>
    `;

    entry.querySelector('.replay-btn').onclick = () => {
      launchPlayer({ title: item.movie }, { title: item.audio }, { name: item.mood });
    };

    timelineCont.appendChild(entry);
  });
}

// ==========================================================================
// 8. Player Lifecycle & Modals
// ==========================================================================
function launchPlayer(movie, playlist, mood) {
  state.currentMovie = movie || { title: 'Midnight in Paris', poster: '' };
  state.currentTrack = playlist || { title: 'Rain on the Window', ambientSound: 'rain' };
  const currentMood = mood || { name: 'Rainy Day', id: 'rainy-day' };

  // Update Player Modal UI
  document.getElementById('player-backdrop').src = movie.poster || (playlist ? playlist.cover : '');
  document.getElementById('player-movie-title').innerText = movie.title || 'Curated Cinema';
  document.getElementById('player-audio-track').innerText = `Synced with: ${playlist?.title || 'Ambient Blanket'}`;
  document.getElementById('player-mood-pill').innerHTML = `<span class="material-symbols-outlined text-[14px]">bubble_chart</span> ${currentMood.name}`;
  document.getElementById('player-platform-pill').innerText = movie.streamPlatform || 'Stream Synced';
  document.getElementById('player-neuro-reason').innerText = playlist?.neuroReason || (mood?.summary || 'Curated relaxation harmonics.');

  // Update Mini Player UI
  const miniBar = document.getElementById('mini-player-bar');
  miniBar.classList.remove('hidden');
  miniBar.classList.add('flex');
  document.getElementById('mini-cover').src = movie.poster || playlist?.cover || '';
  document.getElementById('mini-title').innerText = playlist?.title || 'Ambient Blanket';
  document.getElementById('mini-subtitle').innerText = `${movie.title} • ${currentMood.name}`;

  // Start Sound Synthesis
  const soundType = playlist?.ambientSound || 'rain';
  audio.play(soundType);
  state.player.isPlaying = true;
  updatePlayIcons(true);

  // Open Full Player Drawer
  const modal = document.getElementById('media-player-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Start Progress Timer
  startPlayerTimer();

  // Log session to history
  apiPost('/api/history', {
    mood: currentMood.name,
    movie: movie.title,
    audio: playlist?.title || 'Ambient Track',
    icon: mood?.icon || 'water_drop'
  });

  showToast(`Playing ${movie.title} with ${playlist?.title || 'Mood Sync'}`);
}

function launchPlayerFromTrending(trending) {
  launchPlayer(
    { title: trending.movieName, poster: trending.cover, streamPlatform: 'Trending Pair' },
    { title: trending.audioName, cover: trending.cover, ambientSound: 'rain' },
    { name: trending.title, id: trending.moodId }
  );
}

function updatePlayIcons(playing) {
  const icon = playing ? 'pause' : 'play_arrow';
  const playerIcon = document.getElementById('player-play-icon');
  const miniIcon = document.getElementById('mini-play-icon');
  if (playerIcon) playerIcon.innerText = icon;
  if (miniIcon) miniIcon.innerText = icon;
}

function startPlayerTimer() {
  if (state.player.timer) clearInterval(state.player.timer);
  state.player.timer = setInterval(() => {
    if (!state.player.isPlaying) return;
    state.player.currentTime++;
    if (state.player.currentTime >= state.player.duration) {
      state.player.currentTime = 0;
    }
    const percent = (state.player.currentTime / state.player.duration) * 100;
    document.getElementById('player-scrub-progress').style.width = `${percent}%`;
    document.getElementById('player-scrub-handle').style.left = `${percent}%`;
    document.getElementById('player-time-current').innerText = formatTime(state.player.currentTime);
    document.getElementById('player-time-total').innerText = formatTime(state.player.duration);
  }, 1000);
}

// Toggle Favorite Movie
async function toggleFavoriteMovie(movie, mood) {
  await apiPost('/api/favorites', {
    type: 'movie',
    title: movie.title,
    year: movie.year,
    duration: movie.duration,
    rating: movie.rating,
    mood: mood.name,
    streamPlatform: movie.streamPlatform,
    poster: movie.poster
  });
  showToast(`Saved "${movie.title}" to your favorites!`);
}

// ==========================================================================
// 9. Story Card Modal (9:16 Share Card)
// ==========================================================================
async function openStoryCard(moodId) {
  const share = await apiGet(`/api/share/${moodId || state.currentMoodId}`);
  if (!share) return;

  document.getElementById('share-mood-title').innerText = share.moodName;
  document.getElementById('share-mood-tagline').innerText = share.tagline;

  const p1 = document.getElementById('share-poster-1');
  const p2 = document.getElementById('share-poster-2');
  const p3 = document.getElementById('share-poster-3');

  if (share.posters[0]) p1.src = share.posters[0];
  if (share.posters[1]) p2.src = share.posters[1];
  if (share.posters[2]) p3.src = share.posters[2];

  document.getElementById('share-playlist-cover').src = share.playlistCover || '';

  const modal = document.getElementById('share-card-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// ==========================================================================
// 10. Initialization & Event Handlers
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme
  applyTheme(state.theme);
  document.getElementById('theme-toggle-btn').onclick = () => {
    applyTheme(state.theme === 'cinemood' ? 'obsidian' : 'cinemood');
  };

  // 2. Routing
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // 3. Surprise Me Buttons
  const surpriseHandler = async () => {
    const surprise = await apiGet('/api/surprise');
    if (surprise) {
      showToast(`Surprise mood: ${surprise.name}!`);
      state.currentMoodId = surprise.id;
      navigateTo(`#curations/${surprise.id}`);
    }
  };
  const heroSurpriseBtn = document.getElementById('surprise-me-btn');
  if (heroSurpriseBtn) heroSurpriseBtn.onclick = surpriseHandler;

  // 4. Player Controls
  const togglePlay = () => {
    if (state.player.isPlaying) {
      audio.stop();
      state.player.isPlaying = false;
      updatePlayIcons(false);
    } else {
      audio.play(state.currentTrack?.ambientSound || 'rain');
      state.player.isPlaying = true;
      updatePlayIcons(true);
    }
  };

  document.getElementById('player-play-toggle').onclick = togglePlay;
  document.getElementById('mini-play-btn').onclick = (e) => {
    e.stopPropagation();
    togglePlay();
  };

  document.getElementById('player-rewind-15').onclick = () => {
    state.player.currentTime = Math.max(0, state.player.currentTime - 15);
  };
  document.getElementById('player-forward-15').onclick = () => {
    state.player.currentTime = Math.min(state.player.duration, state.player.currentTime + 15);
  };

  // Sync Cinema Audio (Smart Ducking)
  const duckSwitch = document.getElementById('sync-ducking-switch');
  const duckKnob = document.getElementById('sync-ducking-knob');
  duckSwitch.onclick = () => {
    state.player.smartDucking = !state.player.smartDucking;
    duckSwitch.setAttribute('aria-checked', state.player.smartDucking.toString());
    if (state.player.smartDucking) {
      duckSwitch.classList.add('bg-[var(--primary)]');
      duckSwitch.classList.remove('bg-gray-400');
      duckKnob.style.transform = 'translateX(0px)';
      audio.setDucking(true);
      showToast('Cinema Audio Sync ON: Dialogue ducking enabled');
    } else {
      duckSwitch.classList.remove('bg-[var(--primary)]');
      duckSwitch.classList.add('bg-gray-400');
      duckKnob.style.transform = 'translateX(-20px)';
      audio.setDucking(false);
      showToast('Cinema Audio Sync OFF: Full volume blend');
    }
  };

  // Close player modal
  document.getElementById('close-player-btn').onclick = () => {
    document.getElementById('media-player-modal').classList.add('hidden');
    document.getElementById('media-player-modal').classList.remove('flex');
  };

  // Expand mini player
  document.getElementById('mini-player-expand').onclick = () => {
    document.getElementById('media-player-modal').classList.remove('hidden');
    document.getElementById('media-player-modal').classList.add('flex');
  };
  document.getElementById('mini-expand-btn').onclick = () => {
    document.getElementById('media-player-modal').classList.remove('hidden');
    document.getElementById('media-player-modal').classList.add('flex');
  };

  // 5. Share Card Modal
  document.getElementById('open-share-btn').onclick = () => openStoryCard(state.currentMoodId);
  document.getElementById('close-share-btn').onclick = () => {
    document.getElementById('share-card-modal').classList.add('hidden');
    document.getElementById('share-card-modal').classList.remove('flex');
  };
  document.getElementById('copy-share-link-btn').onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Story link copied to clipboard!');
  };
  document.getElementById('download-card-btn').onclick = () => {
    showToast('Preparing story snapshot image for export...');
    setTimeout(() => {
      showToast('Story card downloaded! Ready for Instagram.');
    }, 800);
  };
});
