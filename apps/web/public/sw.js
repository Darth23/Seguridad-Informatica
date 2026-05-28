/**
 * Service Worker for CyberEdu Zero-Trust Academy
 * Offline-first caching strategy with Workbox
 * 100% client-side operation
 */

const CACHE_NAME = 'cyber-edu-v1';
const STATIC_CACHE = 'cyber-edu-static-v1';
const DYNAMIC_CACHE = 'cyber-edu-dynamic-v1';

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// WASM modules - critical for offline functionality
const WASM_MODULES = [
  '/wasm/core_wasm_bg.wasm',
  '/wasm/network_simulator.wasm',
  '/wasm/crypto_engine.wasm',
  '/wasm/log_analyzer.wasm',
  '/wasm/filesystem_sim.wasm',
  '/wasm/flag_validator.wasm',
  '/wasm/boss_simulator.wasm'
];

// MDX lessons - cached on demand
const LESSON_CACHE_PREFIX = 'lesson-';

// Maximum cache size for dynamic content
const MAX_DYNAMIC_CACHE_SIZE = 100;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate Event - Clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old version caches
              return cacheName.startsWith('cyber-edu-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle WASM modules - cache first strategy
  if (url.pathname.endsWith('.wasm')) {
    event.respondWith(handleWasmRequest(request));
    return;
  }
  
  // Handle MDX/lesson content - cache first with network update
  if (url.pathname.includes('/content/') || url.pathname.endsWith('.mdx')) {
    event.respondWith(handleLessonRequest(request));
    return;
  }
  
  // Handle API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Default strategy: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response for caching
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.ok && response.status === 200) {
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
              trimCache(cache, MAX_DYNAMIC_CACHE_SIZE);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If navigation request, return offline page
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

/**
 * Handle WASM module requests
 * Strategy: Cache first, then network
 */
async function handleWasmRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving WASM from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached WASM module:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch WASM:', request.url, error);
    return new Response('WASM not available', { status: 503 });
  }
}

/**
 * Handle lesson/MDX requests
 * Strategy: Cache first, update in background
 */
async function handleLessonRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Serve from cache but update in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, response.clone()));
        }
      })
      .catch(() => {});
    
    console.log('[SW] Serving lesson from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached lesson:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch lesson:', request.url, error);
    return new Response('Lesson not available offline', { status: 503 });
  }
}

/**
 * Handle API requests
 * Strategy: Network first, no caching for sensitive data
 */
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('[SW] API request failed:', request.url, error);
    return new Response(
      JSON.stringify({ error: 'API unavailable offline' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Trim cache to maximum size (LRU-style)
 */
async function trimCache(cache, maxSize) {
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[SW] Trimmed cache by ${deleteCount} entries`);
  }
}

/**
 * Background sync for analytics events
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Get pending analytics events from IndexedDB
  // This would be implemented with the analyticsDB module
  console.log('[SW] Syncing analytics events...');
}

/**
 * Push notifications for achievements
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CyberEdu', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          return event.source.postMessage({ type: 'CACHE_CLEARED' });
        })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_LESSON') {
    const lessonUrl = event.data.url;
    event.waitUntil(
      fetch(lessonUrl)
        .then((response) => {
          if (response.ok) {
            return caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(lessonUrl, response.clone()));
          }
        })
        .then(() => {
          return event.source.postMessage({ 
            type: 'LESSON_CACHED', 
            url: lessonUrl 
          });
        })
    );
  }
});

console.log('[SW] Service worker loaded');
