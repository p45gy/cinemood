const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting CineMood API Verification Tests...');
  
  // 1. Health
  const health = await get('/api/health');
  console.log('✔ GET /api/health:', health.status, health.data.appName);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Moods
  const moods = await get('/api/moods');
  console.log('✔ GET /api/moods count:', moods.data.length);
  if (!moods.data.length) throw new Error('No moods returned');

  // 3. Curations
  const curations = await get('/api/curations/rainy-day');
  console.log('✔ GET /api/curations/rainy-day:', curations.data.name, 'Movies:', curations.data.movies.length);
  if (!curations.data.movies.length) throw new Error('Curations missing movies');

  // 4. Explore
  const explore = await get('/api/explore?vibe=melancholy');
  console.log('✔ GET /api/explore?vibe=melancholy:', explore.data.movies.length, 'movies found');

  // 5. Mixer Preview
  const mixer = await post('/api/mixer/preview', {
    emotion: 'Rainy & Reflective',
    tempo: 35,
    visualTone: 28,
    nostalgia: 72,
    platforms: ['Criterion', 'Netflix']
  });
  console.log('✔ POST /api/mixer/preview matchScore:', mixer.data.matchScore, 'Title:', mixer.data.vibeTitle);
  if (!mixer.data.matchScore) throw new Error('Mixer preview failed');

  // 6. Favorites
  const favs = await get('/api/favorites');
  console.log('✔ GET /api/favorites count:', favs.data.length);

  // 7. Share
  const share = await get('/api/share/rainy-day');
  console.log('✔ GET /api/share/rainy-day:', share.data.moodName, 'posters:', share.data.posters.length);

  console.log('🎉 ALL API ENDPOINTS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
