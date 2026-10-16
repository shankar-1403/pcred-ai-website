import { useEffect, useRef, useState } from 'react'

// YouTube shows other videos in several places that no embed setting turns off: the pause and end
// screens, and a "More videos" button in its own control bar. This player hides YouTube's controls
// (controls=0), catches every tap itself, draws its own controls, and covers the video whenever it
// is paused or finished, so none of YouTube's suggestions can appear.

let apiPromise = null
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        apiPromise = null
        reject(new Error('YouTube could not be loaded'))
      }
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

// Accepts a bare ID, an ID with a share suffix ("abc123?si=..."), or a full YouTube link
function cleanVideoId(value) {
  const text = String(value || '').trim()
  const fromLink = /(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/.exec(text)
  if (fromLink) return fromLink[1]
  return text.split(/[?&#]/)[0]
}

const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const iconClass = 'h-4 w-4'
const icons = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />,
  replay: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  sound: <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  muted: <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  full: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
}
const Icon = ({ name, className = iconClass }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
    {icons[name]}
  </svg>
)

function YouTubeVideo({ videoId: rawId, title }) {
  const videoId = cleanVideoId(rawId)
  // idle → loading → playing ⇄ paused → ended
  const [state, setState] = useState('idle')
  const [failed, setFailed] = useState(false)
  const [time, setTime] = useState({ now: 0, total: 0 })
  const [muted, setMuted] = useState(false)
  // The video's own name from YouTube; the title prop is only a fallback
  const [name, setName] = useState('')
  const [showName, setShowName] = useState(true)
  const frame = useRef(null)
  const holder = useRef(null)
  const player = useRef(null)

  useEffect(() => () => player.current?.destroy?.(), [])

  // YouTube's public oEmbed endpoint gives the title without loading the player
  useEffect(() => {
    if (!videoId) return undefined
    const controller = new AbortController()
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (typeof data?.title === 'string' && data.title.trim()) setName(data.title.trim())
      })
      .catch(() => {})
    return () => controller.abort()
  }, [videoId])

  // While playing, the name shows for a few seconds, then on hover or tap
  useEffect(() => {
    if (state !== 'playing') return undefined
    const timer = window.setTimeout(() => setShowName(false), 3500)
    return () => window.clearTimeout(timer)
  }, [state])

  // Moves the progress bar while the video plays
  useEffect(() => {
    if (state !== 'playing') return undefined
    const timer = window.setInterval(() => {
      const p = player.current
      if (p?.getCurrentTime) setTime({ now: p.getCurrentTime(), total: p.getDuration() })
    }, 250)
    return () => window.clearInterval(timer)
  }, [state])

  const start = async () => {
    if (player.current) {
      player.current.playVideo()
      return
    }
    setState('loading')
    try {
      const YT = await loadYouTubeApi()
      player.current = new YT.Player(holder.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onReady: (event) => {
            setTime({ now: 0, total: event.target.getDuration() })
            const loaded = event.target.getVideoData?.()?.title
            if (loaded) setName((current) => current || loaded)
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setShowName(true)
              setState('playing')
            }
            else if (event.data === YT.PlayerState.PAUSED) setState('paused')
            else if (event.data === YT.PlayerState.ENDED) setState('ended')
          },
          onError: () => setFailed(true),
        },
      })
    } catch {
      setFailed(true)
    }
  }

  const pause = () => player.current?.pauseVideo?.()
  const replay = () => {
    player.current?.seekTo(0, true)
    player.current?.playVideo()
  }
  const seek = (event) => {
    const to = Number(event.target.value)
    player.current?.seekTo(to, true)
    setTime((current) => ({ ...current, now: to }))
  }
  const toggleMute = () => {
    const p = player.current
    if (!p) return
    if (p.isMuted()) p.unMute()
    else p.mute()
    setMuted(!p.isMuted())
  }
  const fullScreen = () => {
    const el = frame.current
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el?.requestFullscreen?.()
  }

  if (failed) {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 grid place-items-center bg-[#00245A] text-sm font-semibold text-white"
      >
        Watch on YouTube
      </a>
    )
  }

  const covered = state !== 'playing'
  const started = state === 'playing' || state === 'paused' || state === 'ended'

  return (
    <div ref={frame} className="group/video absolute inset-0 overflow-hidden bg-black">
      {/* The YouTube player replaces this element once started; it never receives taps. It is taller
          than the frame so YouTube's title strip sits outside it; the 16:9 video still fits exactly. */}
      <div className="pointer-events-none absolute inset-x-0 -top-[72px] h-[calc(100%+144px)] [&>iframe]:h-full [&>iframe]:w-full">
        <div ref={holder} title={title} />
      </div>

      {/* While playing, a tap anywhere on the picture pauses (YouTube's own tap UI never opens) */}
      {state === 'playing' ? (
        <button type="button" onClick={pause} className="absolute inset-0 z-10 cursor-pointer" aria-label={`Pause ${title}`} />
      ) : null}

      {covered ? (
        <div className="absolute inset-0 z-10">
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className={`h-full w-full object-cover transition ${started ? 'scale-105 blur-sm' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00245A]/80 via-[#00245A]/25 to-transparent" />
          <div className="absolute inset-0 grid place-items-center">
            <button
              type="button"
              onClick={state === 'ended' ? replay : start}
              disabled={state === 'loading'}
              className="group/play flex cursor-pointer flex-col items-center gap-3 text-white focus-visible:outline-none disabled:cursor-progress"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#003BD9] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] ring-8 ring-white/25 transition group-hover/play:scale-105 group-focus-visible/play:ring-[#00B2FC]">
                {state === 'loading' ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#003BD9]/25 border-t-[#003BD9]" />
                ) : (
                  <Icon name={state === 'ended' ? 'replay' : 'play'} className={state === 'ended' ? 'h-7 w-7' : 'ml-1 h-7 w-7'} />
                )}
              </span>
              <span className="rounded-full bg-[#00245A]/70 px-3 py-1 text-xs font-semibold backdrop-blur">
                {state === 'ended' ? 'Watch again' : state === 'paused' ? 'Resume' : 'Play video'}
                <span className="sr-only">: {title}</span>
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {/* The video's name, in place of YouTube's title strip */}
      {name || title ? (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2.5 bg-gradient-to-b from-[#00245A]/85 via-[#00245A]/40 to-transparent px-3.5 pt-3 pb-8 text-white transition duration-300 ${
            state === 'playing' && !showName ? 'opacity-0 group-hover/video:opacity-100' : 'opacity-100'
          }`}
        >
          <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FF0033] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)]">
            <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 truncate text-sm font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{name || title}</p>
        </div>
      ) : null}

      {/* Our own controls, shown once the video has started */}
      {started ? (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-[#00245A]/85 to-transparent px-3 pt-6 pb-2.5 text-white transition sm:gap-3 ${
            state === 'playing' ? 'opacity-0 group-hover/video:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={state === 'playing' ? pause : state === 'ended' ? replay : start}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label={state === 'playing' ? 'Pause' : 'Play'}
          >
            <Icon name={state === 'playing' ? 'pause' : state === 'ended' ? 'replay' : 'play'} />
          </button>
          <input
            type="range"
            min="0"
            max={Math.max(1, Math.round(time.total))}
            step="1"
            value={Math.round(time.now)}
            onChange={seek}
            aria-label="Seek"
            className="h-1 min-w-0 flex-1 cursor-pointer accent-[#00B2FC]"
          />
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/85">
            {clock(time.now)} / {clock(time.total)}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            <Icon name={muted ? 'muted' : 'sound'} />
          </button>
          <button
            type="button"
            onClick={fullScreen}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Full screen"
          >
            <Icon name="full" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default YouTubeVideo
