import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PlayerPortal from './PlayerPortal.tsx'
const OwnerApp =
  import.meta.env.VITE_APP_MODE === 'player' ? null : lazy(() => import('./OwnerApp.tsx'))
const LegacyJournal =
  import.meta.env.VITE_APP_MODE === 'player' ? null : lazy(() => import('./App.tsx'))
const playerMode =
  import.meta.env.VITE_APP_MODE === 'player' ||
  new URLSearchParams(window.location.search).get('player') === '1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p>Opening character companion…</p>}>
      {playerMode ? (
        <PlayerPortal />
      ) : LegacyJournal && new URLSearchParams(window.location.search).get('legacy') === '1' ? (
        <LegacyJournal />
      ) : (
        OwnerApp && <OwnerApp />
      )}
    </Suspense>
  </StrictMode>,
)
