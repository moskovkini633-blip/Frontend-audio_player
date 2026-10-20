// @ts-nocheck
import { create } from 'zustand'

export const usePlayerStore = create((set) => ({
  track: null,
  isPlaying: false,
  current: 0,
  duration: 0,
  progress: 0,
  volume: 1,
  favorites: [],

  toggleFavorite: (track) =>
    set((state) => {
      const exists = state.favorites.some(
        (item) => item.trackId === track.trackId,
      )
      return {
        favorites: exists
          ? state.favorites.filter((item) => item.trackId !== track.trackId)
          : [...state.favorites, track],
      }
    }),
  setTrack: (track) =>
    set({
      track,
      isPlaying: false,
      current: 0,
      duration: 0,
      progress: 0,
    }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setTime: ({ current, progress }) => set({ current, progress }),
  setDuration: (duration) => set({ duration }),
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),
}))

export const useSearchStore = create((set) => ({
  query: '',
  tracks: [],
  isLoading: false,
  error: null,

  setQuery: (query) => set({ query }),
  searchTracks: async (query) => {
    if (!query.trim()) return
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(
        'https://itunes.apple.com/search?term=' +
          encodeURIComponent(query) +
          '&entity=song&limit=10',
      )
      if (!response.ok) {
        throw new Error('Ошибка запроса: ' + response.status)
      }
      const data = await response.json()
      set({ tracks: data.results })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Неизвестная ошибка' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
