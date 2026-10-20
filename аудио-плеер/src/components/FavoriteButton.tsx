// @ts-nocheck
import { usePlayerStore } from '../store'
import './FavoriteButton.css'

function FavoriteButton({ track, className = '' }) {
  const favorites = usePlayerStore((state) => state.favorites)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)

  if (!track) return null

  const active = favorites.some((item) => item.trackId === track.trackId)

  return (
    <button
      type="button"
      className={'favorite-button' + (active ? ' active' : '') + (className ? ' ' + className : '')}
      onClick={(event) => {
        event.stopPropagation()
        toggleFavorite(track)
      }}
      aria-pressed={active}
      aria-label={active ? 'Убрать из избранного' : 'Добавить в избранное'}
      title={active ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20.7 4.8 13.5a4.8 4.8 0 0 1 6.8-6.8L12 7.1l.4-.4a4.8 4.8 0 0 1 6.8 6.8z"
          fill={active ? 'currentColor' : 'transparent'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default FavoriteButton
