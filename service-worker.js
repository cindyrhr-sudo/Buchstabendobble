// ============================================================
// Service Worker für Buchstaben-Dobble (Offline-Fähigkeit)
//
// WICHTIG BEI UPDATES: Wenn du index.html, style.css, cards.js o.ä.
// änderst, erhöhe die Versionsnummer unten (v1 -> v2 -> ...). Sonst
// laden die iPads weiterhin die alte, gecachte Version.
// ============================================================
const CACHE_VERSION = 'v1';
const CACHE_NAME = `buchstaben-dobble-${CACHE_VERSION}`;

const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './cards.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './fonts/andika-latin-400.woff2'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(
                APP_SHELL.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('Konnte nicht gecacht werden:', url, err);
                    })
                )
            )
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key.startsWith('buchstaben-dobble-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Cache-First mit Netzwerk-Fallback; bei Offline-Navigation Rückfall auf index.html
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request)
                .then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
