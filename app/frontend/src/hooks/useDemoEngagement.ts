import { useEffect, useState } from 'react'
import type { Platform } from './solana'

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

function tickEngagement(current: number, threshold: number, platform: Platform, contentId: string): number {
  const h = seed(contentId, platform, 'tick')
  const bump = 80 + (h % 420)
  const cap = Math.floor(threshold * 1.15)
  return Math.min(current + bump, cap)
}

export type DemoEngagement = {
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

  const [current, setCurrent] = useState(() =>
    useSettled ? settledValue : getDemoEngagementStart(contentId, platform, threshold),
  )

  useEffect(() => {
    if (useSettled) {
      setCurrent(settledValue)
      return
    }
    setCurrent(getDemoEngagementStart(contentId, platform, threshold))
  }, [contentId, platform, threshold, useSettled, settledValue])

  useEffect(() => {
    if (!isLive || useSettled) return

    const delay = 2000 + (seed(contentId, platform, 'interval') % 2500)
    const id = setInterval(() => {
      setCurrent((c) => tickEngagement(c, threshold, platform, contentId))
    }, delay)

    return () => clearInterval(id)
  }, [contentId, platform, threshold, isLive, useSettled])

  const progress = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0

  return {
    current,
    threshold,
    progress,
    isOverTarget: current >= threshold,
    isSimulated: !useSettled,
  }
}
