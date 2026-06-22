import { useEffect, useRef, useState } from 'react'
import type { Platform } from '@/lib/solana'

const VIEW_STEPS = [10, 20, 50, 100] as const
const ENGAGEMENT_STEPS = [10, 20, 50, 100] as const

function seed(contentId: string, platform: Platform, salt = ''): number {
  let h = 2166136261
  const s = `${platform}:${contentId}:${salt}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Stable starting engagement per market (unique per content + platform). */
export function getDemoEngagementStart(
  contentId: string,
  platform: Platform,
  threshold: number,
): number {
  const h = seed(contentId, platform)
  const pct = 0.18 + (h % 65) / 100 // 18%–83% of target
  return Math.max(500, Math.floor(threshold * pct))
}

function getDemoViewsStart(contentId: string, platform: Platform, threshold: number): number {
  const h = seed(contentId, platform, 'views')
  const pct = 0.45 + (h % 40) / 100 // 45%–85% of target — raw views run higher
  return Math.max(1_000, Math.floor(threshold * pct))
}

function pickStep(steps: readonly number[], tick: number, contentId: string, platform: Platform, salt: string): number {
  const h = seed(contentId, platform, `${salt}-${tick}`)
  return steps[h % steps.length]
}

function tickViews(current: number, tick: number, contentId: string, platform: Platform): number {
  return current + pickStep(VIEW_STEPS, tick, contentId, platform, 'view-step')
}

function tickEngagement(
  current: number,
  threshold: number,
  tick: number,
  contentId: string,
  platform: Platform,
): number {
  const step = pickStep(ENGAGEMENT_STEPS, tick, contentId, platform, 'eng-step')
  const h = seed(contentId, platform, `eng-dir-${tick}`)
  const goesDown = h % 2 === 0
  const delta = goesDown ? -step : step
  const floor = Math.max(0, Math.floor(threshold * 0.08))
  const cap = Math.floor(threshold * 1.18)
  return Math.min(cap, Math.max(floor, current + delta))
}

function tickDelayMs(tick: number, contentId: string, platform: Platform): number {
  const h = seed(contentId, platform, `delay-${tick}`)
  return 600 + (h % 2400) // 0.6s – 3s between ticks
}

export type DemoEngagement = {
  /** Raw view count — only ever increases (reels display). */
  views: number
  /** Bet metric (views/likes) — can move up or down toward threshold. */
  engagement: number
  /** @deprecated use `engagement` */
  current: number
  threshold: number
  progress: number
  isOverTarget: boolean
  isSimulated: boolean
}

export function useDemoEngagement(
  contentId: string,
  platform: Platform,
  threshold: number,
  options: { isLive: boolean; settledValue?: number } = { isLive: true },
): DemoEngagement {
  const { isLive, settledValue = 0 } = options
  const useSettled = !isLive && settledValue > 0

  const [views, setViews] = useState(() =>
    useSettled ? settledValue : getDemoViewsStart(contentId, platform, threshold),
  )
  const [engagement, setEngagement] = useState(() =>
    useSettled ? settledValue : getDemoEngagementStart(contentId, platform, threshold),
  )
  const tickRef = useRef(0)

  useEffect(() => {
    if (useSettled) {
      setViews(settledValue)
      setEngagement(settledValue)
      return
    }
    tickRef.current = 0
    setViews(getDemoViewsStart(contentId, platform, threshold))
    setEngagement(getDemoEngagementStart(contentId, platform, threshold))
  }, [contentId, platform, threshold, useSettled, settledValue])

  useEffect(() => {
    if (!isLive || useSettled) return

    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false

    const runTick = () => {
      const tick = tickRef.current
      tickRef.current += 1

      setViews((v) => tickViews(v, tick, contentId, platform))
      setEngagement((e) => tickEngagement(e, threshold, tick, contentId, platform))

      if (!cancelled) {
        timeoutId = setTimeout(runTick, tickDelayMs(tick, contentId, platform))
      }
    }

    timeoutId = setTimeout(runTick, tickDelayMs(0, contentId, platform))

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [contentId, platform, threshold, isLive, useSettled])

  const progress = threshold > 0 ? Math.min(100, (engagement / threshold) * 100) : 0

  return {
    views,
    engagement,
    current: engagement,
    threshold,
    progress,
    isOverTarget: engagement >= threshold,
    isSimulated: !useSettled,
  }
}
