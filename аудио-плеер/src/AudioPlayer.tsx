// @ts-nocheck
import { useEffect, useRef } from 'react'
import Controls from './Controls'
import FavoriteButton from './components/FavoriteButton'
import { attachAudio, detachAudio, resumeAudio } from './components/audioEnergy'
import './AudioPlayer.css'
import { usePlayerStore } from './store'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}

function IconVolume({ volume }) {
  if (volume === 0) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-label="Звук выключен"
      >
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
      </svg>
    )
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Громкость"
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}

function AudioPlayer({ src }) {
  const track = usePlayerStore((state) => state.track)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const current = usePlayerStore((state) => state.current)
  const duration = usePlayerStore((state) => state.duration)
  const progress = usePlayerStore((state) => state.progress)
  const volume = usePlayerStore((state) => state.volume)
  const setPlaying = usePlayerStore((state) => state.setPlaying)
  const setDuration = usePlayerStore((state) => state.setDuration)
  const setTime = usePlayerStore((state) => state.setTime)
  const setProgress = usePlayerStore((state) => state.setProgress)
  const setVolume = usePlayerStore((state) => state.setVolume)

  const audioRef = useRef(null)

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      resumeAudio()
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  const seekBy = (delta) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(
      Math.max(0, audio.currentTime + delta),
      audio.duration || 0,
    )
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    attachAudio(audio)
    return () => detachAudio()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    resumeAudio()
    audio.play().catch(() => {})
  }, [track])

  const handleProgress = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    setProgress(value)
    if (audio.duration) {
      audio.currentTime = (value / 100) * audio.duration
    }
  }

  const handleVolume = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    setVolume(value)
    audio.volume = value
  }

  return (
    <div className="player">
      {track && (
        <div className="now-playing">
          <img
            className="cover"
            src={track.artworkUrl100.replace('100x100bb', '600x600bb')}
            alt={track.trackName}
          />
          <div className="now-playing-row">
            <div className="now-playing-text">
              <strong>{track.trackName}</strong>
              <small>{track.artistName}</small>
            </div>
            <FavoriteButton track={track} />
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={src}
        crossOrigin="anonymous"
        onPlay={() => {
          resumeAudio()
          setPlaying(true)
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget
          setTime({
            current: audio.currentTime,
            progress: audio.duration
              ? (audio.currentTime / audio.duration) * 100
              : 0,
          })
        }}
      />

      <Controls isPlaying={isPlaying} onPlay={togglePlay} onSeek={seekBy} />

      <input
        type="range"
        value={progress}
        min={0}
        max={100}
        step={0.1}
        onChange={handleProgress}
      />

      <div className="time">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="volume">
        <IconVolume volume={volume} />
        <input
          type="range"
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolume}
        />
      </div>
    </div>
  )
}

export default AudioPlayer
