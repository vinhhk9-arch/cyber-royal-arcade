const CACHE = 'cyber-royal-arcade-v2';
const ASSETS = ['./','./index.html','./sanhcho.html','./banca.html','./doden.html',
    './tailwind.css','./mobile.css','./mobile.js','./fishes.js','./game.js',
    './manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(Promise.all([
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith('cyber-royal-arcade-')).map(k => caches.delete(k)))),
        self.clients.claim()
    ]));
});
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
    e.respondWith(fetch(e.request).then(response => {
        if (response.ok) {
            const copy = response.clone();
            e.waitUntil(caches.open(CACHE).then(c => c.put(e.request,copy)));
        }
        return response;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
