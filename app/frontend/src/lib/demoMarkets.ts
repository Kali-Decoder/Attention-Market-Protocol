import type { Platform } from './solana'

export type DemoMarketMeta = {
  contentId: string
  platform: Platform
  title: string
  creator: string
  description: string
  engagementLabel: string
  threshold: number
  deadlineHours: number
  gradient: string
  emoji: string
}

/** Curated demo markets — seed these on localnet before a demo. */
export const DEMO_MARKETS: DemoMarketMeta[] = [
  {
    contentId: 'viral-dance-challenge',
    platform: 'tikTok',
    title: 'Viral Dance Challenge',
    creator: '@dancequeen',
    description: 'A trending choreography reel gaining momentum across TikTok.',
    engagementLabel: 'views',
    threshold: 500_000,
    deadlineHours: 72,
    gradient: 'from-pink-600 via-rose-500 to-orange-400',
    emoji: '💃',
  },
  {
    contentId: 'summer-recipe-reel',
    platform: 'instagram',
    title: '60-Second Summer Pasta',
    creator: '@chefmaria',
    description: 'Quick recipe reel targeting food lovers on Instagram.',
    engagementLabel: 'likes',
    threshold: 250_000,
    deadlineHours: 48,
    gradient: 'from-purple-600 via-violet-500 to-fuchsia-400',
    emoji: '🍝',
  },
  {
    contentId: 'tech-review-short',
    platform: 'youTube',
    title: 'AI Phone Review',
    creator: '@techdaily',
    description: 'YouTube Short reviewing the latest AI-powered smartphone.',
    engagementLabel: 'views',
    threshold: 1_000_000,
    deadlineHours: 96,
    gradient: 'from-red-600 via-red-500 to-rose-400',
    emoji: '📱',
  },
  {
    contentId: 'comedy-sketch-42',
    platform: 'tikTok',
    title: 'Office Comedy Sketch',
    creator: '@laughlab',
    description: 'Relatable workplace humor clip with strong early traction.',
    engagementLabel: 'views',
    threshold: 100_000,
    deadlineHours: 24,
    gradient: 'from-cyan-600 via-teal-500 to-emerald-400',
    emoji: '😂',
  },
  {
    contentId: 'fitness-transformation',
    platform: 'instagram',
    title: '30-Day Transformation',
    creator: '@fitwithj',
    description: 'Before/after fitness reel with high share potential.',
    engagementLabel: 'likes',
    threshold: 75_000,
    deadlineHours: 48,
    gradient: 'from-green-600 via-lime-500 to-yellow-400',
    emoji: '💪',
  },
  {
    contentId: 'music-cover-2026',
    platform: 'youTube',
    title: 'Acoustic Cover — Hit Single',
    creator: '@acoustica',
    description: 'Stripped-down cover of a chart-topping track as a YouTube Short.',
    engagementLabel: 'views',
    threshold: 200_000,
    deadlineHours: 48,
    gradient: 'from-indigo-600 via-blue-500 to-sky-400',
    emoji: '🎸',
  },
]

export function getDemoMeta(contentId: string, platform: Platform) {
  return DEMO_MARKETS.find((m) => m.contentId === contentId && m.platform === platform)
}

export function platformFromParam(param: string): Platform {
  if (param === 'tiktok') return 'tikTok'
  if (param === 'youtube') return 'youTube'
  return 'instagram'
}

export function platformToParam(platform: Platform): string {
  if (platform === 'tikTok') return 'tiktok'
  if (platform === 'youTube') return 'youtube'
  return 'instagram'
}

export function platformLabel(platform: Platform): string {
  if (platform === 'tikTok') return 'TikTok'
  if (platform === 'youTube') return 'YouTube'
  return 'Instagram'
}
