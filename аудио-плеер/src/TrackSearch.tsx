// @ts-nocheck
import { useState } from 'react'
import './TrackSearch.css'
import FavoriteButton from './components/FavoriteButton'
import { usePlayerStore, useSearchStore } from './store'

function TrackList({ items, activeId, onSelect }) {
  return (
    <ul className="track-list">
      {items.map((item) => (
        <li key={item.trackId} className="track-row">
          <button
            type="button"
            className={item.trackId === activeId ? 'track active' : 'track'}
            onClick={() => onSelect(item)}
          >
            <img src={item.artworkUrl100} alt="" width="48" height="48" />
            <span className="track-text">
              <strong>{item.trackName}</strong>
              <small>{item.artistName}</small>
            </span>
          </button>
          <FavoriteButton track={item} />
        </li>
      ))}
    </ul>
  )
}

function TrackSearch() {
  const { query, tracks, isLoading, error, setQuery, searchTracks } = useSearchStore()
  const track = usePlayerStore((state) => state.track)
  const setTrack = usePlayerStore((state) => state.setTrack)
  const favorites = usePlayerStore((state) => state.favorites)
  const [tab, setTab] = useState('search')

  const search = (e) => {
    e.preventDefault()
    searchTracks(query)
  }

  return (
    <div className="search">
      <h2>Музыка</h2>

      <div className="tabs" role="tablist" aria-label="Разделы">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'search'}
          className={tab === 'search' ? 'active' : ''}
          onClick={() => setTab('search')}
        >
          Поиск
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'favorites'}
          className={tab === 'favorites' ? 'active' : ''}
          onClick={() => setTab('favorites')}
        >
          Избранное{favorites.length > 0 ? ' (' + favorites.length + ')' : ''}
        </button>
      </div>

      {tab === 'search' ? (
        <>
          <form className="search-bar" onSubmit={search}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название или исполнитель"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? 'Загрузка…' : 'Найти'}
            </button>
          </form>

          {isLoading && <p className="status">Загрузка…</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <TrackList
            items={tracks}
            activeId={track?.trackId}
            onSelect={setTrack}
          />
        </>
      ) : favorites.length === 0 ? (
        <p className="status empty">
          Пока нет избранных треков. Добавляй их сердечком в поиске.
        </p>
      ) : (
        <TrackList
          items={favorites}
          activeId={track?.trackId}
          onSelect={setTrack}
        />
      )}
    </div>
  )
}

export default TrackSearch
