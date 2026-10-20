// @ts-nocheck
import { useEffect } from 'react'
import AudioPlayer from './AudioPlayer'
import TrackSearch from './TrackSearch'
import ContourBackground from './components/ContourBackground'
import ThemeToggle from './components/ThemeToggle'
import { usePlayerStore } from './store'
import { useThemeStore } from './components/themeStore'

function App() {
  const track = usePlayerStore((state) => state.track)
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <>
      <ContourBackground />
      <ThemeToggle />
      <main className="app">
        <AudioPlayer
          key={track?.trackId ?? 'default'}
          src={track?.previewUrl ?? undefined}
        />
        <TrackSearch />
      </main>
    </>
  )
}

export default App
