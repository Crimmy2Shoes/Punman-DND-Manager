import { useState } from 'react'
import { Modal } from './components'
import { createPlayerLink } from './playerAccess'

export default function PlayerLinks({ onClose }: { onClose: () => void }) {
  const [host, setHost] = useState(
    () =>
      localStorage.getItem('punpun-player-host') ||
      window.location.origin + import.meta.env.BASE_URL,
  )
  const [sheet, setSheet] = useState('')
  const [notice, setNotice] = useState('')
  let link = '',
    error = ''
  if (sheet && host) {
    try {
      link = createPlayerLink(host, sheet)
    } catch (e) {
      error = (e as Error).message
    }
  }
  return (
    <Modal title="Player character link" onClose={onClose}>
      <p>
        Players can paste their sheet’s URL directly into the app. This optional link prefills it.
      </p>
      <div className="field-grid">
        <label className="field">
          <span>Player app address</span>
          <input
            aria-label="Player app address"
            value={host}
            onChange={(e) => {
              setHost(e.target.value)
              setNotice('')
            }}
          />
        </label>
        <label className="field">
          <span>Player’s spreadsheet URL</span>
          <input
            aria-label="Player’s spreadsheet URL"
            value={sheet}
            onChange={(e) => {
              setSheet(e.target.value)
              setNotice('')
            }}
          />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      {link && (
        <>
          <label className="field">
            <span>Character link</span>
            <input
              className="player-link-output"
              aria-label="Character link"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <button
            onClick={() =>
              void (async () => {
                try {
                  localStorage.setItem('punpun-player-host', host)
                  await navigator.clipboard.writeText(link)
                  setNotice('Link copied.')
                } catch {
                  setNotice('Select the character link above and copy it.')
                }
              })()
            }
          >
            Copy player link
          </button>
          {new URL(host).hostname === 'localhost' && (
            <p className="hint">
              Localhost is a preview on your computer. Use the hosted player app address when
              sending links to friends.
            </p>
          )}
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      <p className="hint">
        Google Drive sharing controls access, including permissions inherited from your shared
        folder.
      </p>
      <a href={`${import.meta.env.BASE_URL}PLAYER_SETUP.md`} target="_blank" rel="noreferrer">
        Hosting and sharing setup
      </a>
    </Modal>
  )
}
