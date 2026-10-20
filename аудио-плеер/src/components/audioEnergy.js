// @ts-nocheck
// Audio energy is kept outside React/Zustand: it updates every frame and
// must not trigger re-renders.

const nodes = new WeakMap()
const energy = { bass: 0, mid: 0, treble: 0, level: 0 }

let context = null
let active = null
let detachTimer = 0
let detachedEntry = null

function getContext() {
  if (context) return context
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return null
  context = new AudioContextCtor()
  return context
}

function connect(entry) {
  if (entry.connected) return
  entry.source.connect(entry.analyser)
  entry.analyser.connect(entry.context.destination)
  entry.connected = true
}

function disconnect(entry) {
  if (!entry.connected) return
  try {
    entry.source.disconnect()
  } catch {
    // Already disconnected.
  }
  try {
    entry.analyser.disconnect()
  } catch {
    // Already disconnected.
  }
  entry.connected = false
}

export function attachAudio(audio) {
  if (!audio) return
  const ctx = getContext()
  if (!ctx) return

  if (detachTimer) {
    clearTimeout(detachTimer)
    detachTimer = 0
    detachedEntry = null
  }

  let entry = nodes.get(audio)
  if (!entry) {
    try {
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.75
      entry = {
        context: ctx,
        source,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
        connected: false,
      }
      nodes.set(audio, entry)
    } catch {
      return
    }
  }

  connect(entry)
  active = entry
  ctx.resume().catch(() => {})
}

export function detachAudio() {
  const entry = active
  active = null
  energy.bass = 0
  energy.mid = 0
  energy.treble = 0
  energy.level = 0
  if (!entry) return

  // Defer the disconnect so StrictMode's attach -> detach -> attach cycle
  // reuses the same MediaElementSource instead of failing to create a new one.
  detachedEntry = entry
  detachTimer = setTimeout(() => {
    detachTimer = 0
    if (active === entry || entry !== detachedEntry) return
    disconnect(entry)
  }, 0)
}

export function resumeAudio() {
  if (context && context.state === 'suspended') {
    context.resume().catch(() => {})
  }
}

function smooth(current, target) {
  return current + (target - current) * 0.22
}

export function getEnergy() {
  if (!active) return energy

  const { analyser, data, context: ctx } = active
  analyser.getByteFrequencyData(data)

  const binHz = ctx.sampleRate / 2 / data.length
  let bassSum = 0
  let midSum = 0
  let trebleSum = 0
  let bassCount = 0
  let midCount = 0
  let trebleCount = 0

  for (let i = 1; i < data.length; i += 1) {
    const hz = i * binHz
    const value = data[i] / 255
    if (hz < 250) {
      bassSum += value
      bassCount += 1
    } else if (hz < 2000) {
      midSum += value
      midCount += 1
    } else if (hz < 8000) {
      trebleSum += value
      trebleCount += 1
    }
  }

  const bass = bassCount ? bassSum / bassCount : 0
  const mid = midCount ? midSum / midCount : 0
  const treble = trebleCount ? trebleSum / trebleCount : 0

  energy.bass = smooth(energy.bass, bass)
  energy.mid = smooth(energy.mid, mid)
  energy.treble = smooth(energy.treble, treble)
  energy.level = (energy.bass + energy.mid + energy.treble) / 3

  return energy
}
