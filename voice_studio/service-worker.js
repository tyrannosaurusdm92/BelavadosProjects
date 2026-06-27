const CACHE = 'voice-studio-winsafe-v2';
const ASSETS = ['./','./index.html','./s/style.css','./s/app.js','./s/data-loader.js','./s/voice-profile.js','./s/audio-renderer.js','./s/backend-client.js','./s/smart-assistants.js','./s/biomes.json','./s/races.json','./s/voices.json'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.filter(Boolean))).catch(()=>{})); });
self.addEventListener('fetch', event => { event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))); });
