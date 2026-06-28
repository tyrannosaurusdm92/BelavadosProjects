const CACHE = 'voice-studio-superbot-merged-v5';
const ASSETS = ['./','./index.html','./s/style.css','./s/app.js','./s/data-loader.js','./s/voice-profile.js','./s/audio-renderer.js','./s/backend-client.js','./s/smart-assistants.js','./s/voice-source-bot.js','./s/zip-export.js','./s/biomes.json','./s/races.json','./s/voices.json','./s/conversation-scanner-randomizer.js','./s/embedded-document-scanner.js','./s/scanner-rules.json','./s/embedded-document-scanner-config.json','./s/superbot-voice-brain.js'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.filter(Boolean))).catch(()=>{})); });
self.addEventListener('fetch', event => { event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))); });
