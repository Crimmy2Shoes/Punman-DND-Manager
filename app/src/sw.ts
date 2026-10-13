/// <reference lib="webworker" />
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching'
import type { PrecacheEntry } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'
const sw = self as unknown as ServiceWorkerGlobalScope
precacheAndRoute((self as unknown as { __WB_MANIFEST: PrecacheEntry[] }).__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
clientsClaim()
sw.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void sw.skipWaiting()
})
