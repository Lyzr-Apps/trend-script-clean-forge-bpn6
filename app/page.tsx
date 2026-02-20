'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaFacebookF,
} from 'react-icons/fa6'
import {
  LuLayoutDashboard,
  LuHistory,
  LuSettings,
  LuTrendingUp,
  LuCopy,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuFilter,
  LuCalendar,
  LuSend,
  LuPencil,
  LuClock,
  LuLoader2,
  LuX,
  LuCircleCheck,
  LuCircleAlert,
  LuHash,
  LuExternalLink,
  LuTrash2,
  LuSparkles,
} from 'react-icons/lu'

// =========================================================================
// Constants
// =========================================================================
const CONTENT_PIPELINE_MANAGER_ID = '699878ee97f966a0d9ca80c4'
const POST_SCHEDULER_AGENT_ID = '69987900ad9589c32de456d2'

const PLATFORMS = ['Twitter', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube', 'Facebook'] as const
type PlatformName = (typeof PLATFORMS)[number]

const PLATFORM_KEYS: Record<PlatformName, string> = {
  Twitter: 'twitter',
  LinkedIn: 'linkedin',
  Instagram: 'instagram',
  TikTok: 'tiktok',
  YouTube: 'youtube',
  Facebook: 'facebook',
}

const PLATFORM_ICONS: Record<PlatformName, React.ReactNode> = {
  Twitter: <FaXTwitter className="w-4 h-4" />,
  LinkedIn: <FaLinkedinIn className="w-4 h-4" />,
  Instagram: <FaInstagram className="w-4 h-4" />,
  TikTok: <FaTiktok className="w-4 h-4" />,
  YouTube: <FaYoutube className="w-4 h-4" />,
  Facebook: <FaFacebookF className="w-4 h-4" />,
}

const STORAGE_KEYS = {
  history: 'contentflow-history',
  defaultPlatforms: 'contentflow-default-platforms',
  brandVoice: 'contentflow-brand-voice',
}

// =========================================================================
// Types
// =========================================================================
interface TrendItem {
  topic?: string
  description?: string
  hashtags?: string[]
  platforms?: string[]
  content_angles?: string[]
}

interface TrendSummary {
  trends?: TrendItem[]
  summary?: string
}

interface ScriptData {
  content?: string
  character_count?: number
  hashtags?: string[]
  format?: string
}

interface ScriptsMap {
  [key: string]: ScriptData | undefined
}

interface PostingResult {
  platform?: string
  status?: string
  message?: string
  post_url?: string
}

interface HistoryEntry {
  id: string
  timestamp: string
  topic: string
  platforms: PlatformName[]
  trendSummary: TrendSummary | null
  scripts: ScriptsMap | null
  postingResults: PostingResult[] | null
  postingSummary: string | null
  status: 'draft' | 'scheduled' | 'posted'
}

type ScreenName = 'dashboard' | 'history' | 'settings'

// =========================================================================
// Notification type
// =========================================================================
interface NotificationData {
  type: 'success' | 'error'
  message: string
  id: number
}

// =========================================================================
// Sample data
// =========================================================================
const SAMPLE_TREND_SUMMARY: TrendSummary = {
  trends: [
    {
      topic: 'AI Productivity Tools',
      description: 'The rise of AI-powered productivity tools is transforming how professionals manage their workflows, with a focus on automation and intelligent assistants.',
      hashtags: ['#AIProductivity', '#FutureOfWork', '#AutomationTools'],
      platforms: ['Twitter', 'LinkedIn'],
      content_angles: ['Tool comparisons', 'Workflow optimization tips', 'Real-world case studies'],
    },
    {
      topic: 'Remote Work Evolution',
      description: 'Hybrid and remote work models continue to evolve with new collaboration technologies and management approaches gaining traction.',
      hashtags: ['#RemoteWork', '#HybridWork', '#DigitalNomad'],
      platforms: ['LinkedIn', 'Instagram'],
      content_angles: ['Best practices', 'Tool recommendations', 'Team culture building'],
    },
    {
      topic: 'No-Code Movement',
      description: 'No-code and low-code platforms are democratizing software development, enabling non-technical founders and creators to build applications.',
      hashtags: ['#NoCode', '#LowCode', '#BuildInPublic'],
      platforms: ['Twitter', 'TikTok', 'YouTube'],
      content_angles: ['Tutorial content', 'Success stories', 'Platform comparisons'],
    },
  ],
  summary: 'Current trends show strong interest in AI-powered productivity tools, the evolution of remote work models, and the growing no-code movement. Content should focus on practical applications and real-world use cases.',
}

const SAMPLE_SCRIPTS: ScriptsMap = {
  twitter: {
    content: 'AI productivity tools are changing the game.\n\nHere are 5 tools that saved me 10+ hours this week:\n\n1. Cursor - AI-powered coding\n2. Notion AI - Smart documentation\n3. Otter.ai - Meeting transcription\n4. Grammarly - Writing assistance\n5. Zapier - Workflow automation\n\nWhich ones are you using?',
    character_count: 267,
    hashtags: ['#AIProductivity', '#FutureOfWork', '#TechTools'],
    format: 'thread_opener',
  },
  linkedin: {
    content: 'The AI Productivity Revolution Is Here\n\nAfter testing 50+ AI tools over the past quarter, I have identified the ones that genuinely transform workflows:\n\nKey Findings:\n- Average time saved: 12 hours per week\n- Most impactful area: Content creation and documentation\n- Biggest surprise: AI meeting assistants outperform manual note-taking by 3x\n\nThe tools that stood out are not just automating tasks -- they are fundamentally changing how we approach work.\n\nWhat AI tools have made the biggest difference in your productivity?',
    character_count: 498,
    hashtags: ['#AIProductivity', '#FutureOfWork', '#Innovation', '#Leadership'],
    format: 'professional_post',
  },
  instagram: {
    content: 'Stop working harder. Start working smarter.\n\nAI tools that actually deliver results (save this for later):\n\nSlide 1: The Problem - Spending 60+ hours on repetitive tasks\nSlide 2: The Solution - AI-powered automation\nSlide 3: Top 5 Tools with use cases\nSlide 4: Before vs After metrics\nSlide 5: How to get started today\n\nDouble tap if you are ready to transform your workflow.',
    character_count: 387,
    hashtags: ['#AITools', '#ProductivityHacks', '#WorkSmarter', '#TechTips', '#AIRevolution'],
    format: 'carousel_caption',
  },
  tiktok: {
    content: 'POV: You discover AI tools that do your work for you\n\nHook: I replaced 10 hours of work with 5 AI tools\n\nScript:\n- Show before: drowning in tasks, multiple tabs open\n- Transition: discovering AI tools\n- Show after: smooth workflow, tasks completing automatically\n- Reveal: the 5 tools and what each does\n- CTA: Follow for more AI productivity tips\n\nTrending sound: Use a productivity/transformation trending audio',
    character_count: 410,
    hashtags: ['#AITools', '#ProductivityTok', '#WorkSmarter', '#TechTok', '#AIHacks'],
    format: 'short_video_script',
  },
  youtube: {
    content: 'Title: I Tested 50 AI Tools So You Do Not Have To -- Here Are the Top 5\n\nIntro (0:00-0:30): Hook with time-saved metrics\nChapter 1 (0:30-3:00): The AI Productivity Landscape\nChapter 2 (3:00-8:00): Deep dive into each tool\nChapter 3 (8:00-11:00): Real workflow demonstrations\nChapter 4 (11:00-13:00): Cost analysis and ROI\nOutro (13:00-14:00): Summary and call to action\n\nKey talking points:\n- Real metrics from 3 months of testing\n- Side-by-side comparisons\n- Integration tips for each tool',
    character_count: 512,
    hashtags: ['#AIProductivity', '#TechReview', '#ProductivityTools'],
    format: 'long_video_script',
  },
  facebook: {
    content: 'AI is not replacing workers. It is empowering them.\n\nI have been experimenting with AI productivity tools for the past 3 months, and the results are remarkable:\n\n- 40% reduction in time spent on emails\n- 3x faster content creation\n- Zero missed meeting action items\n\nThe best part? Most of these tools are free or under $20/month.\n\nDrop a comment if you want me to share my complete toolkit and setup guide.',
    character_count: 412,
    hashtags: ['#AIProductivity', '#WorkSmarter', '#Technology'],
    format: 'engagement_post',
  },
}

const SAMPLE_POSTING_RESULTS: PostingResult[] = [
  { platform: 'Twitter', status: 'posted', message: 'Successfully posted to Twitter/X', post_url: 'https://x.com/user/status/1234567890' },
  { platform: 'LinkedIn', status: 'ready', message: 'Content formatted and ready for manual posting' },
  { platform: 'Instagram', status: 'ready', message: 'Carousel content prepared for manual posting' },
  { platform: 'TikTok', status: 'ready', message: 'Script ready for video production' },
  { platform: 'YouTube', status: 'ready', message: 'Full script ready for video production' },
  { platform: 'Facebook', status: 'ready', message: 'Content formatted and ready for posting' },
]

// =========================================================================
// Helpers
// =========================================================================
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// =========================================================================
// ErrorBoundary
// =========================================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// =========================================================================
// Notification Banner
// =========================================================================
function NotificationBanner({ notifications, onDismiss }: { notifications: NotificationData[]; onDismiss: (id: number) => void }) {
  if (notifications.length === 0) return null
  return (
    <div className="space-y-2 mb-6">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            'flex items-center justify-between px-4 py-3 border text-sm',
            n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          <div className="flex items-center gap-2">
            {n.type === 'success' ? <LuCircleCheck className="w-4 h-4 flex-shrink-0" /> : <LuCircleAlert className="w-4 h-4 flex-shrink-0" />}
            <span>{n.message}</span>
          </div>
          <button onClick={() => onDismiss(n.id)} className="ml-4 flex-shrink-0">
            <LuX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

// =========================================================================
// Platform Toggle Chip
// =========================================================================
function PlatformChip({
  platform,
  selected,
  onToggle,
}: {
  platform: PlatformName
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
      )}
    >
      {PLATFORM_ICONS[platform]}
      <span>{platform}</span>
    </button>
  )
}

// =========================================================================
// Script Card
// =========================================================================
function ScriptCard({
  platform,
  script,
  selected,
  onToggle,
  onContentChange,
  copiedPlatform,
  onCopy,
}: {
  platform: PlatformName
  script: ScriptData | undefined
  selected: boolean
  onToggle: () => void
  onContentChange: (content: string) => void
  copiedPlatform: string | null
  onCopy: (platform: PlatformName, content: string) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const content = script?.content ?? ''
  const charCount = content.length
  const hashtags = Array.isArray(script?.hashtags) ? script.hashtags : []
  const format = script?.format ?? ''
  const isCopied = copiedPlatform === PLATFORM_KEYS[platform]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border shadow-none">
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {PLATFORM_ICONS[platform]}
                <CardTitle className="text-sm font-semibold font-serif tracking-tight">{platform}</CardTitle>
              </div>
              {format && <Badge variant="secondary" className="text-xs">{format}</Badge>}
              <Badge variant="outline" className="text-xs">{charCount} chars</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle()}
                className={cn(
                  'text-xs px-2 py-1 border transition-colors',
                  selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {selected ? 'Selected' : 'Excluded'}
              </button>
              <button
                onClick={() => onCopy(platform, content)}
                className="p-1 hover:bg-muted transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? <LuCheck className="w-4 h-4 text-green-600" /> : <LuCopy className="w-4 h-4 text-muted-foreground" />}
              </button>
              <CollapsibleTrigger asChild>
                <button className="p-1 hover:bg-muted transition-colors">
                  {isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4 pt-3 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[120px] text-sm leading-relaxed font-sans border-border resize-y"
              placeholder="Script content..."
            />
            {hashtags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <LuHash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                {hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// =========================================================================
// Loading Skeletons
// =========================================================================
function LoadingSkeletons() {
  return (
    <div className="space-y-6 mt-6">
      <Card className="border border-border shadow-none">
        <CardHeader className="p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-border shadow-none">
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =========================================================================
// History Card
// =========================================================================
function HistoryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: HistoryEntry
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const dateStr = new Date(entry.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const statusColor =
    entry.status === 'posted' ? 'bg-green-100 text-green-700 border-green-200' :
    entry.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-blue-200' :
    'bg-muted text-muted-foreground border-border'

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-serif font-semibold tracking-tight text-sm truncate">{entry.topic}</h3>
              <Badge className={cn('text-xs border', statusColor)}>{entry.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <LuClock className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                {entry.platforms.length} platforms
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="flex gap-1">
              {entry.platforms.map((p) => (
                <span key={p} className="text-muted-foreground">{PLATFORM_ICONS[p]}</span>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
              title="Delete entry"
            >
              <LuTrash2 className="w-4 h-4" />
            </button>
            {expanded ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-4 pt-0 space-y-4">
          <Separator />
          {entry.trendSummary?.summary && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trend Summary</h4>
              <div className="text-sm leading-relaxed">{renderMarkdown(entry.trendSummary.summary)}</div>
            </div>
          )}
          {entry.scripts && Object.keys(entry.scripts).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Scripts</h4>
              <div className="space-y-2">
                {Object.entries(entry.scripts).map(([key, script]) => {
                  if (!script?.content) return null
                  const platformName = PLATFORMS.find((p) => PLATFORM_KEYS[p] === key)
                  return (
                    <div key={key} className="border border-border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {platformName && PLATFORM_ICONS[platformName]}
                        <span className="text-xs font-semibold">{platformName ?? key}</span>
                        <Badge variant="outline" className="text-xs">{(script.content ?? '').length} chars</Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{script.content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {Array.isArray(entry.postingResults) && entry.postingResults.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Posting Results</h4>
              <div className="space-y-1">
                {entry.postingResults.map((pr, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn('w-2 h-2 rounded-full', pr?.status === 'posted' ? 'bg-green-500' : 'bg-yellow-500')} />
                    <span className="font-medium">{pr?.platform ?? 'Unknown'}</span>
                    <span className="text-muted-foreground">{pr?.message ?? ''}</span>
                    {pr?.post_url && (
                      <a href={pr.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        View <LuExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// =========================================================================
// Main Page
// =========================================================================
export default function Page() {
  // ----- Navigation -----
  const [activeScreen, setActiveScreen] = useState<ScreenName>('dashboard')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ----- Dashboard State -----
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformName>>(new Set(PLATFORMS))
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null)
  const [scripts, setScripts] = useState<ScriptsMap | null>(null)
  const [platformsForPosting, setPlatformsForPosting] = useState<Set<PlatformName>>(new Set(PLATFORMS))
  const [postingResults, setPostingResults] = useState<PostingResult[] | null>(null)
  const [postingSummary, setPostingSummary] = useState<string | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [generatedTopic, setGeneratedTopic] = useState('')

  // ----- Sample Data -----
  const [showSampleData, setShowSampleData] = useState(false)

  // ----- Notifications -----
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const notifIdRef = useRef(0)

  // ----- History State -----
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'posted'>('all')
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState<PlatformName | 'all'>('all')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')

  // ----- Settings State -----
  const [settingsDefaultPlatforms, setSettingsDefaultPlatforms] = useState<Set<PlatformName>>(new Set(PLATFORMS))
  const [brandVoice, setBrandVoice] = useState('')

  // Load from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch { /* ignore */ }
    try {
      const savedDefPlatforms = localStorage.getItem(STORAGE_KEYS.defaultPlatforms)
      if (savedDefPlatforms) {
        const parsed = JSON.parse(savedDefPlatforms)
        if (Array.isArray(parsed)) {
          const validPlatforms = parsed.filter((p: string) => PLATFORMS.includes(p as PlatformName)) as PlatformName[]
          const platformSet = new Set(validPlatforms)
          setSettingsDefaultPlatforms(platformSet)
          setSelectedPlatforms(new Set(platformSet))
        }
      }
    } catch { /* ignore */ }
    try {
      const savedVoice = localStorage.getItem(STORAGE_KEYS.brandVoice)
      if (savedVoice) setBrandVoice(savedVoice)
    } catch { /* ignore */ }
  }, [])

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: HistoryEntry[]) => {
    setHistory(newHistory)
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(newHistory))
    } catch { /* ignore */ }
  }, [])

  // Notification helpers
  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++notifIdRef.current
    setNotifications((prev) => [...prev, { type, message, id }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Copy handler
  const handleCopy = useCallback(async (platform: PlatformName, content: string) => {
    const key = PLATFORM_KEYS[platform]
    const success = await copyToClipboard(content)
    if (success) {
      setCopiedPlatform(key)
      setTimeout(() => setCopiedPlatform(null), 2000)
    }
  }, [])

  // Toggle platform for generation
  const togglePlatform = useCallback((platform: PlatformName) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }, [])

  // Toggle platform for posting
  const togglePostingPlatform = useCallback((platform: PlatformName) => {
    setPlatformsForPosting((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }, [])

  // Update script content
  const updateScriptContent = useCallback((platformKey: string, content: string) => {
    setScripts((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [platformKey]: {
          ...prev[platformKey],
          content,
          character_count: content.length,
        },
      }
    })
  }, [])

  // ----- Generate Content -----
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      addNotification('error', 'Please enter a topic to generate content.')
      return
    }
    if (selectedPlatforms.size === 0) {
      addNotification('error', 'Please select at least one platform.')
      return
    }

    setIsGenerating(true)
    setTrendSummary(null)
    setScripts(null)
    setPostingResults(null)
    setPostingSummary(null)
    setActiveAgentId(CONTENT_PIPELINE_MANAGER_ID)

    try {
      const platformList = Array.from(selectedPlatforms).join(', ')
      const voiceGuideline = brandVoice.trim() || 'Professional and engaging'
      const message = `Research trending topics and generate platform-specific content scripts for the niche: ${topic.trim()}. Target platforms: ${platformList}. Brand voice guidelines: ${voiceGuideline}`

      const result = await callAIAgent(message, CONTENT_PIPELINE_MANAGER_ID)

      if (result?.success) {
        const agentData = result?.response?.result
        const ts: TrendSummary = agentData?.trend_summary ?? null
        const sc: ScriptsMap = agentData?.scripts ?? null

        setTrendSummary(ts)
        setScripts(sc)
        setGeneratedTopic(topic.trim())

        // Set posting platforms based on which scripts were returned
        if (sc) {
          const activePlatforms = new Set<PlatformName>()
          for (const p of PLATFORMS) {
            const key = PLATFORM_KEYS[p]
            if (sc[key]?.content && selectedPlatforms.has(p)) {
              activePlatforms.add(p)
            }
          }
          setPlatformsForPosting(activePlatforms)
        }

        // Save to history as draft
        const newEntry: HistoryEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          topic: topic.trim(),
          platforms: Array.from(selectedPlatforms),
          trendSummary: ts,
          scripts: sc,
          postingResults: null,
          postingSummary: null,
          status: 'draft',
        }
        saveHistory([newEntry, ...history])

        addNotification('success', 'Content generated successfully! Review and edit your scripts below.')
      } else {
        const errMsg = result?.error ?? result?.response?.message ?? 'Failed to generate content.'
        addNotification('error', errMsg)
      }
    } catch (err) {
      addNotification('error', 'An unexpected error occurred during content generation.')
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
    }
  }, [topic, selectedPlatforms, brandVoice, history, saveHistory, addNotification])

  // ----- Schedule / Post -----
  const handleSchedule = useCallback(async () => {
    if (!scripts) return
    if (platformsForPosting.size === 0) {
      addNotification('error', 'Please select at least one platform for posting.')
      return
    }

    setIsScheduling(true)
    setActiveAgentId(POST_SCHEDULER_AGENT_ID)

    try {
      const selectedPlatformNames = Array.from(platformsForPosting)
      const twitterKey = PLATFORM_KEYS['Twitter']
      const twitterContent = scripts[twitterKey]?.content ?? ''

      // Build the content summary for each platform
      const platformContentParts = selectedPlatformNames.map((p) => {
        const key = PLATFORM_KEYS[p]
        const content = scripts[key]?.content ?? ''
        return `${p} script: ${content}`
      })

      const message = `Post the following approved content to the selected platforms. For Twitter, use the TWITTER_CREATION_OF_A_POST tool. Twitter script: ${twitterContent}. For other platforms, format the content for manual posting. Platforms selected: ${selectedPlatformNames.join(', ')}. ${platformContentParts.join('. ')}`

      const result = await callAIAgent(message, POST_SCHEDULER_AGENT_ID)

      if (result?.success) {
        const agentData = result?.response?.result
        const pr = Array.isArray(agentData?.posting_results) ? agentData.posting_results : []
        const summary = agentData?.summary ?? ''

        setPostingResults(pr)
        setPostingSummary(summary)

        // Update history entry
        const updatedHistory = [...history]
        if (updatedHistory.length > 0) {
          const latestIdx = updatedHistory.findIndex((e) => e.topic === generatedTopic && e.status === 'draft')
          if (latestIdx >= 0) {
            updatedHistory[latestIdx] = {
              ...updatedHistory[latestIdx],
              postingResults: pr,
              postingSummary: summary,
              scripts: scripts,
              status: pr.some((r: PostingResult) => r?.status === 'posted') ? 'posted' : 'scheduled',
            }
            saveHistory(updatedHistory)
          }
        }

        addNotification('success', summary || 'Content scheduled/posted successfully!')
      } else {
        const errMsg = result?.error ?? result?.response?.message ?? 'Failed to schedule content.'
        addNotification('error', errMsg)
      }
    } catch {
      addNotification('error', 'An unexpected error occurred during scheduling.')
    } finally {
      setIsScheduling(false)
      setActiveAgentId(null)
    }
  }, [scripts, platformsForPosting, history, generatedTopic, saveHistory, addNotification])

  // ----- Sample Data Toggle -----
  useEffect(() => {
    if (showSampleData) {
      setTrendSummary(SAMPLE_TREND_SUMMARY)
      setScripts({ ...SAMPLE_SCRIPTS })
      setGeneratedTopic('AI productivity tools')
      setTopic('AI productivity tools')
      setPlatformsForPosting(new Set(PLATFORMS))
      setPostingResults(SAMPLE_POSTING_RESULTS)
      setPostingSummary('Successfully posted to Twitter. Content formatted and ready for manual posting on 5 other platforms.')
    } else {
      setTrendSummary(null)
      setScripts(null)
      setPostingResults(null)
      setPostingSummary(null)
      setGeneratedTopic('')
      setTopic('')
    }
  }, [showSampleData])

  // ----- Settings Save -----
  const saveSettingsDefaultPlatforms = useCallback((platforms: Set<PlatformName>) => {
    setSettingsDefaultPlatforms(platforms)
    try {
      localStorage.setItem(STORAGE_KEYS.defaultPlatforms, JSON.stringify(Array.from(platforms)))
    } catch { /* ignore */ }
  }, [])

  const saveBrandVoice = useCallback((voice: string) => {
    setBrandVoice(voice)
    try {
      localStorage.setItem(STORAGE_KEYS.brandVoice, voice)
    } catch { /* ignore */ }
  }, [])

  // ----- History Filtering -----
  const filteredHistory = history.filter((entry) => {
    if (historyStatusFilter !== 'all' && entry.status !== historyStatusFilter) return false
    if (historyPlatformFilter !== 'all' && !entry.platforms.includes(historyPlatformFilter)) return false
    if (historyDateFrom) {
      const from = new Date(historyDateFrom)
      if (new Date(entry.timestamp) < from) return false
    }
    if (historyDateTo) {
      const to = new Date(historyDateTo)
      to.setHours(23, 59, 59, 999)
      if (new Date(entry.timestamp) > to) return false
    }
    return true
  })

  const deleteHistoryEntry = useCallback((id: string) => {
    const updated = history.filter((e) => e.id !== id)
    saveHistory(updated)
  }, [history, saveHistory])

  // ----- Sidebar Nav Items -----
  const navItems: { screen: ScreenName; icon: React.ReactNode; label: string }[] = [
    { screen: 'dashboard', icon: <LuLayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { screen: 'history', icon: <LuHistory className="w-5 h-5" />, label: 'Content History' },
    { screen: 'settings', icon: <LuSettings className="w-5 h-5" />, label: 'Settings' },
  ]

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* ============ SIDEBAR ============ */}
        <aside className="w-60 flex-shrink-0 border-r border-sidebar-border bg-[hsl(var(--sidebar-background))] flex flex-col fixed inset-y-0 left-0 z-30">
          {/* Logo */}
          <div className="p-6 pb-4">
            <h1 className="font-serif text-xl font-bold tracking-tight text-[hsl(var(--sidebar-foreground))]">
              ContentFlow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">AI Content Pipeline</p>
          </div>
          <Separator className="mx-4" />
          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => setActiveScreen(item.screen)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                  activeScreen === item.screen
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] font-semibold'
                    : 'text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          {/* Agent Status */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Agents</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', activeAgentId === CONTENT_PIPELINE_MANAGER_ID ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
                <span className="truncate">Pipeline Manager</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', activeAgentId === POST_SCHEDULER_AGENT_ID ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
                <span className="truncate">Post Scheduler</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 ml-60">
          <ScrollArea className="h-screen">
            <div className="max-w-5xl mx-auto p-8">
              {/* Sample Data Toggle */}
              <div className="flex items-center justify-end gap-2 mb-6">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
                <Switch
                  id="sample-toggle"
                  checked={showSampleData}
                  onCheckedChange={setShowSampleData}
                />
              </div>

              <NotificationBanner notifications={notifications} onDismiss={dismissNotification} />

              {/* ============ DASHBOARD ============ */}
              {activeScreen === 'dashboard' && (
                <div className="space-y-8">
                  {/* Header */}
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight">Content Generator</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Enter a topic to research trends and generate platform-specific content scripts.
                    </p>
                  </div>

                  {/* Topic Input */}
                  <Card className="border border-border shadow-none">
                    <CardContent className="p-6 space-y-5">
                      <div>
                        <Label htmlFor="topic-input" className="text-sm font-medium mb-2 block">Topic or Niche</Label>
                        <Input
                          id="topic-input"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., AI productivity tools, fitness trends"
                          maxLength={200}
                          className="border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">{topic.length}/200 characters</p>
                      </div>

                      {/* Platform Selector */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Target Platforms</Label>
                        <div className="flex flex-wrap gap-2">
                          {PLATFORMS.map((p) => (
                            <PlatformChip
                              key={p}
                              platform={p}
                              selected={selectedPlatforms.has(p)}
                              onToggle={() => togglePlatform(p)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim() || selectedPlatforms.size === 0}
                        className="w-full h-11 font-medium"
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <LuLoader2 className="w-4 h-4 animate-spin" />
                            Generating content... (this may take 15-30 seconds)
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LuSparkles className="w-4 h-4" />
                            Generate Content
                          </span>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Loading Skeletons */}
                  {isGenerating && <LoadingSkeletons />}

                  {/* Content Review Panel */}
                  {!isGenerating && trendSummary && (
                    <div className="space-y-6">
                      <Separator />
                      <div>
                        <h3 className="font-serif text-lg font-bold tracking-tight mb-1">Content Review</h3>
                        <p className="text-xs text-muted-foreground">Review and edit the generated content before scheduling.</p>
                      </div>

                      {/* Trend Summary */}
                      <Card className="border border-border shadow-none">
                        <CardHeader className="p-6 pb-3">
                          <div className="flex items-center gap-2">
                            <LuTrendingUp className="w-5 h-5 text-[hsl(var(--accent))]" />
                            <CardTitle className="font-serif text-base font-bold tracking-tight">Trend Insights</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                          {trendSummary.summary && (
                            <div className="text-sm leading-relaxed text-muted-foreground">
                              {renderMarkdown(trendSummary.summary)}
                            </div>
                          )}
                          {Array.isArray(trendSummary.trends) && trendSummary.trends.length > 0 && (
                            <div className="space-y-3 mt-3">
                              {trendSummary.trends.map((trend, i) => (
                                <div key={i} className="border border-border p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-serif font-semibold text-sm tracking-tight">{trend?.topic ?? 'Untitled Trend'}</h4>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {Array.isArray(trend?.platforms) && trend.platforms.map((pl, j) => {
                                        const match = PLATFORMS.find((pp) => pp.toLowerCase() === (pl ?? '').toLowerCase())
                                        return match ? (
                                          <span key={j} className="text-muted-foreground">{PLATFORM_ICONS[match]}</span>
                                        ) : null
                                      })}
                                    </div>
                                  </div>
                                  {trend?.description && (
                                    <p className="text-xs leading-relaxed text-muted-foreground">{trend.description}</p>
                                  )}
                                  {Array.isArray(trend?.hashtags) && trend.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {trend.hashtags.map((tag, j) => (
                                        <Badge key={j} variant="secondary" className="text-xs">{tag}</Badge>
                                      ))}
                                    </div>
                                  )}
                                  {Array.isArray(trend?.content_angles) && trend.content_angles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {trend.content_angles.map((angle, j) => (
                                        <Badge key={j} variant="outline" className="text-xs">{angle}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Script Cards */}
                      {scripts && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <LuPencil className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-serif text-base font-bold tracking-tight">Platform Scripts</h3>
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {Array.from(platformsForPosting).length} selected for posting
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PLATFORMS.map((p) => {
                              const key = PLATFORM_KEYS[p]
                              const script = scripts[key]
                              if (!script?.content) return null
                              return (
                                <ScriptCard
                                  key={p}
                                  platform={p}
                                  script={script}
                                  selected={platformsForPosting.has(p)}
                                  onToggle={() => togglePostingPlatform(p)}
                                  onContentChange={(content) => updateScriptContent(key, content)}
                                  copiedPlatform={copiedPlatform}
                                  onCopy={handleCopy}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Approve & Schedule Button */}
                      {scripts && !postingResults && (
                        <Card className="border border-border shadow-none">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-serif font-semibold text-sm tracking-tight">Ready to publish?</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {platformsForPosting.size} platform{platformsForPosting.size !== 1 ? 's' : ''} selected. Twitter will be posted directly; others will be formatted for manual posting.
                                </p>
                              </div>
                              <Button
                                onClick={handleSchedule}
                                disabled={isScheduling || platformsForPosting.size === 0}
                                className="h-10 px-6"
                              >
                                {isScheduling ? (
                                  <span className="flex items-center gap-2">
                                    <LuLoader2 className="w-4 h-4 animate-spin" />
                                    Scheduling...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <LuSend className="w-4 h-4" />
                                    Approve & Schedule
                                  </span>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Posting Results */}
                      {Array.isArray(postingResults) && postingResults.length > 0 && (
                        <Card className="border border-border shadow-none">
                          <CardHeader className="p-6 pb-3">
                            <div className="flex items-center gap-2">
                              <LuCalendar className="w-5 h-5 text-[hsl(var(--accent))]" />
                              <CardTitle className="font-serif text-base font-bold tracking-tight">Posting Results</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 pt-0 space-y-3">
                            {postingSummary && (
                              <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                                {renderMarkdown(postingSummary)}
                              </p>
                            )}
                            <div className="space-y-2">
                              {postingResults.map((pr, i) => (
                                <div key={i} className="flex items-center justify-between border border-border p-3">
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const match = PLATFORMS.find((pp) => pp.toLowerCase() === (pr?.platform ?? '').toLowerCase())
                                      return match ? PLATFORM_ICONS[match] : null
                                    })()}
                                    <div>
                                      <span className="text-sm font-medium">{pr?.platform ?? 'Unknown'}</span>
                                      <p className="text-xs text-muted-foreground">{pr?.message ?? ''}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={pr?.status === 'posted' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {pr?.status ?? 'unknown'}
                                    </Badge>
                                    {pr?.post_url && (
                                      <a
                                        href={pr.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                      >
                                        View <LuExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isGenerating && !trendSummary && !showSampleData && (
                    <Card className="border border-border shadow-none">
                      <CardContent className="p-12 text-center">
                        <LuSparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-serif text-lg font-semibold tracking-tight mb-1">Start Creating</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                          Enter a topic above to research trending content and generate platform-specific scripts for your audience.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ============ CONTENT HISTORY ============ */}
              {activeScreen === 'history' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight">Content History</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Browse and review your past content generation runs.
                    </p>
                  </div>

                  {/* Filter Bar */}
                  <Card className="border border-border shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <LuFilter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                          <select
                            value={historyStatusFilter}
                            onChange={(e) => setHistoryStatusFilter(e.target.value as typeof historyStatusFilter)}
                            className="w-full h-9 px-3 text-sm border border-border bg-card text-foreground"
                          >
                            <option value="all">All</option>
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="posted">Posted</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Platform</Label>
                          <select
                            value={historyPlatformFilter}
                            onChange={(e) => setHistoryPlatformFilter(e.target.value as typeof historyPlatformFilter)}
                            className="w-full h-9 px-3 text-sm border border-border bg-card text-foreground"
                          >
                            <option value="all">All Platforms</option>
                            {PLATFORMS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                          <Input
                            type="date"
                            value={historyDateFrom}
                            onChange={(e) => setHistoryDateFrom(e.target.value)}
                            className="h-9 text-sm border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                          <Input
                            type="date"
                            value={historyDateTo}
                            onChange={(e) => setHistoryDateTo(e.target.value)}
                            className="h-9 text-sm border-border"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* History List */}
                  {filteredHistory.length > 0 ? (
                    <div className="space-y-3">
                      {filteredHistory.map((entry) => (
                        <HistoryCard
                          key={entry.id}
                          entry={entry}
                          expanded={expandedHistoryId === entry.id}
                          onToggle={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}
                          onDelete={() => deleteHistoryEntry(entry.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="border border-border shadow-none">
                      <CardContent className="p-12 text-center">
                        <LuHistory className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-serif text-lg font-semibold tracking-tight mb-1">No Content Yet</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                          {history.length === 0
                            ? 'No content generated yet. Head to the Dashboard to create your first content batch.'
                            : 'No entries match the current filters. Try adjusting your filter criteria.'}
                        </p>
                        {history.length === 0 && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setActiveScreen('dashboard')}
                          >
                            <LuLayoutDashboard className="w-4 h-4 mr-2" />
                            Go to Dashboard
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ============ SETTINGS ============ */}
              {activeScreen === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Configure default preferences for content generation and publishing.
                    </p>
                  </div>

                  {/* Default Platforms */}
                  <Card className="border border-border shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardTitle className="font-serif text-base font-bold tracking-tight">Default Platforms</CardTitle>
                      <p className="text-xs text-muted-foreground">Select which platforms are enabled by default when generating content.</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-3">
                        {PLATFORMS.map((p) => (
                          <div key={p} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                            <div className="flex items-center gap-3">
                              {PLATFORM_ICONS[p]}
                              <span className="text-sm font-medium">{p}</span>
                            </div>
                            <Switch
                              checked={settingsDefaultPlatforms.has(p)}
                              onCheckedChange={(checked) => {
                                const next = new Set(settingsDefaultPlatforms)
                                if (checked) {
                                  next.add(p)
                                } else {
                                  next.delete(p)
                                }
                                saveSettingsDefaultPlatforms(next)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4 text-xs"
                        onClick={() => {
                          setSelectedPlatforms(new Set(settingsDefaultPlatforms))
                          addNotification('success', 'Default platforms applied to Dashboard.')
                        }}
                      >
                        Apply to Dashboard
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Brand Voice */}
                  <Card className="border border-border shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardTitle className="font-serif text-base font-bold tracking-tight">Brand Voice</CardTitle>
                      <p className="text-xs text-muted-foreground">Define your brand voice guidelines. This will be included in every content generation request.</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-3">
                      <Textarea
                        value={brandVoice}
                        onChange={(e) => saveBrandVoice(e.target.value)}
                        placeholder="e.g., Professional yet approachable. Use data-driven insights. Avoid jargon. Speak directly to the reader."
                        className="min-h-[120px] text-sm leading-relaxed border-border resize-y"
                      />
                      <p className="text-xs text-muted-foreground">
                        {brandVoice.trim() ? 'Your brand voice guidelines will be included in content generation prompts.' : 'No brand voice set. Default: "Professional and engaging"'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Integration Status */}
                  <Card className="border border-border shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardTitle className="font-serif text-base font-bold tracking-tight">Integrations</CardTitle>
                      <p className="text-xs text-muted-foreground">Platform connection status for automated posting.</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-3">
                        {PLATFORMS.map((p) => {
                          const isTwitter = p === 'Twitter'
                          return (
                            <div key={p} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                              <div className="flex items-center gap-3">
                                {PLATFORM_ICONS[p]}
                                <span className="text-sm font-medium">{p}</span>
                              </div>
                              {isTwitter ? (
                                <Badge className="text-xs bg-green-100 text-green-700 border border-green-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
                                  Connected
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </ErrorBoundary>
  )
}
