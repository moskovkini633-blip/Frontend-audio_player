// @ts-nocheck
function IconRewind() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        10
      </text>
    </svg>
  )
}

function IconForward() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        transform="scale(-1 1) translate(-24 0)"
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
      />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        10
      </text>
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}

function Controls({ isPlaying, onPlay, onSeek }) {
  return (
    <div className="controls">
      <button
        type="button"
        onClick={() => onSeek(-10)}
        aria-label="Назад на 10 секунд"
        title="Назад на 10 секунд"
      >
        <IconRewind />
      </button>
      <button
        type="button"
        onClick={onPlay}
        aria-label={isPlaying ? 'Пауза' : 'Играть'}
        title={isPlaying ? 'Пауза' : 'Играть'}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>
      <button
        type="button"
        onClick={() => onSeek(10)}
        aria-label="Вперёд на 10 секунд"
        title="Вперёд на 10 секунд"
      >
        <IconForward />
      </button>
    </div>
  )
}

export default Controls
