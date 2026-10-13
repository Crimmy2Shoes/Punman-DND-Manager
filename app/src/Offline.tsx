import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}
export default function Offline({
  busy,
  label = 'Local journal',
}: {
  busy: boolean
  label?: string
}) {
  const [install, setInstall] = useState<InstallEvent | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [help, setHelp] = useState(false)
  const {
    offlineReady: [ready, setReady],
    needRefresh: [refresh],
    updateServiceWorker,
  } = useRegisterSW()
  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault()
        setInstall(e as InstallEvent)
      },
      online = () => setOnline(true),
      offline = () => setOnline(false),
      installed = () => setInstall(null)
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])
  return (
    <div className="offline-status">
      <span>{online ? label : `Offline · ${label.toLowerCase()}`}</span>
      <button
        onClick={async () => {
          if (install) {
            await install.prompt()
            await install.userChoice
            setInstall(null)
          } else setHelp(!help)
        }}
      >
        {install ? 'Install app' : 'Install help'}
      </button>
      {ready && (
        <span>
          Ready for offline use{' '}
          <button onClick={() => setReady(false)} aria-label="Dismiss offline notification">
            ×
          </button>
        </span>
      )}
      {refresh && (
        <button disabled={busy} onClick={() => void updateServiceWorker(true)}>
          Update available · reload
        </button>
      )}
      {help && (
        <p className="hint">
          Install from your browser’s menu (Install app / Add to Home Screen). Offline installation
          works with a production build on localhost or HTTPS. Vite development mode does not
          install an offline cache.
        </p>
      )}
    </div>
  )
}
