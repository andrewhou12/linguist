import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Flex,
  Text,
  Button,
  Card,
  RadioCards,
  Slider,
  Badge,
  Progress,
  Separator,
  TextField,
  TextArea,
} from '@radix-ui/themes'
import { Check, ChevronRight, ChevronLeft, BookOpen, Languages, Target, Sparkles, Keyboard, FileText, X } from 'lucide-react'
import type {
  AssessmentItem,
  ReadingChallengeItem,
  ComprehensionItem,
  OnboardingResult,
  ReadingChallengeResult,
  ComprehensionResult,
  SelfReportedLevel,
} from '@shared/types'
import { useAuth } from '../../contexts/auth-context'

type Step = 'welcome' | 'language' | 'level' | 'assessment' | 'reading_challenge' | 'comprehension' | 'preferences' | 'complete'

const STEPS: Step[] = ['welcome', 'language', 'level', 'assessment', 'reading_challenge', 'comprehension', 'preferences', 'complete']

const isMac = window.platform === 'darwin'

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [nativeLanguage, setNativeLanguage] = useState('English')
  const [selfReportedLevel, setSelfReportedLevel] = useState<SelfReportedLevel>('beginner')
  const [dailyNewItemLimit, setDailyNewItemLimit] = useState(10)
  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([])
  const [knownItems, setKnownItems] = useState<Set<number>>(new Set())
  const [readingItems, setReadingItems] = useState<ReadingChallengeItem[]>([])
  const [readingResults, setReadingResults] = useState<ReadingChallengeResult[]>([])
  const [comprehensionItems, setComprehensionItems] = useState<ComprehensionItem[]>([])
  const [comprehensionResults, setComprehensionResults] = useState<ComprehensionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [computedLevel, setComputedLevel] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }, [step])

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }, [step])

  const handleLevelSelect = useCallback(
    (level: SelfReportedLevel) => {
      setSelfReportedLevel(level)
      setKnownItems(new Set())
      setReadingResults([])
      setComprehensionResults([])
      goNext()
    },
    [goNext]
  )

  useEffect(() => {
    if (step !== 'assessment') return
    let cancelled = false
    setLoading(true)
    window.linguist
      .onboardingGetAssessment(selfReportedLevel)
      .then((items) => { if (!cancelled) setAssessmentItems(items) })
      .catch((err) => console.error('Failed to load assessment items:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [step, selfReportedLevel])

  useEffect(() => {
    if (step !== 'reading_challenge') return
    let cancelled = false
    setLoading(true)
    window.linguist
      .onboardingGetReadingChallenge(selfReportedLevel)
      .then((items) => { if (!cancelled) setReadingItems(items) })
      .catch((err) => console.error('Failed to load reading challenge:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [step, selfReportedLevel])

  useEffect(() => {
    if (step !== 'comprehension') return
    let cancelled = false
    setLoading(true)
    window.linguist
      .onboardingGetComprehension(selfReportedLevel)
      .then((items) => { if (!cancelled) setComprehensionItems(items) })
      .catch((err) => console.error('Failed to load comprehension items:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [step, selfReportedLevel])

  const toggleKnown = useCallback((index: number) => {
    setKnownItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleSubmitOnboarding = useCallback(async () => {
    setSubmitting(true)
    try {
      const result: OnboardingResult = {
        targetLanguage: 'Japanese',
        nativeLanguage,
        selfReportedLevel,
        dailyNewItemLimit,
        knownItemIndices: Array.from(knownItems),
        readingChallengeResults: readingResults,
        comprehensionResults,
      }
      const { computedLevel: level } = await window.linguist.onboardingComplete(result)
      setComputedLevel(level)
    } finally {
      setSubmitting(false)
    }
  }, [nativeLanguage, selfReportedLevel, dailyNewItemLimit, knownItems, readingResults, comprehensionResults])

  // Trigger submission when entering the complete step
  useEffect(() => {
    if (step === 'complete' && !computedLevel && !submitting) {
      handleSubmitOnboarding()
    }
  }, [step, computedLevel, submitting, handleSubmitOnboarding])

  const readingCorrect = readingResults.filter((r) => r.correct).length

  return (
    <Flex
      direction="column"
      align="center"
      style={{ height: '100vh', overflow: 'auto' }}
    >
      {isMac && (
        <div
          className="titlebar-drag-region"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, zIndex: 1 }}
        />
      )}

      <Flex
        direction="column"
        align="center"
        style={{ maxWidth: 600, width: '100%', padding: '80px 24px 48px' }}
        gap="5"
      >
        <Progress value={progress} size="1" style={{ width: '100%' }} />

        {step === 'welcome' && <WelcomeStep name={user?.name ?? null} onNext={goNext} />}
        {step === 'language' && (
          <LanguageStep
            nativeLanguage={nativeLanguage}
            onNativeLanguageChange={setNativeLanguage}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'level' && <LevelStep onSelect={handleLevelSelect} onBack={goBack} />}
        {step === 'assessment' && (
          <AssessmentStep
            items={assessmentItems}
            knownItems={knownItems}
            loading={loading}
            onToggle={toggleKnown}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'reading_challenge' && (
          <ReadingChallengeStep
            items={readingItems}
            loading={loading}
            onComplete={(results) => { setReadingResults(results); goNext() }}
            onBack={goBack}
          />
        )}
        {step === 'comprehension' && (
          <ComprehensionStep
            items={comprehensionItems}
            loading={loading}
            onComplete={(results) => { setComprehensionResults(results); goNext() }}
            onBack={goBack}
          />
        )}
        {step === 'preferences' && (
          <PreferencesStep
            dailyNewItemLimit={dailyNewItemLimit}
            onDailyLimitChange={setDailyNewItemLimit}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 'complete' && (
          <CompleteStep
            knownCount={knownItems.size}
            totalCount={assessmentItems.length}
            readingCorrect={readingCorrect}
            readingTotal={readingResults.length}
            comprehensionCount={comprehensionResults.length}
            selfReportedLevel={selfReportedLevel}
            computedLevel={computedLevel}
            submitting={submitting}
            onComplete={completeOnboarding}
            onBack={goBack}
          />
        )}
      </Flex>
    </Flex>
  )
}

// ── Welcome ──

function WelcomeStep({ name, onNext }: { name: string | null; onNext: () => void }) {
  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" align="center" gap="5" p="4">
        <Flex
          align="center"
          justify="center"
          style={{ width: 64, height: 64, borderRadius: 'var(--radius-4)', background: 'var(--accent-3)' }}
        >
          <Languages size={32} color="var(--accent-11)" />
        </Flex>
        <Flex direction="column" align="center" gap="2">
          <Text size="7" weight="bold">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</Text>
          <Text size="3" color="gray" align="center" style={{ maxWidth: 400 }}>
            Let's set up your personalized learning experience. We'll ask a few
            questions to understand your current level and tailor your study plan.
          </Text>
        </Flex>
        <Text size="2" color="gray" align="center">This takes about 3–4 minutes.</Text>
        <Button size="3" onClick={onNext} style={{ width: '100%', maxWidth: 300 }}>
          Get Started <ChevronRight size={16} />
        </Button>
      </Flex>
    </Card>
  )
}

// ── Language ──

function LanguageStep({
  nativeLanguage, onNativeLanguageChange, onNext, onBack,
}: { nativeLanguage: string; onNativeLanguageChange: (l: string) => void; onNext: () => void; onBack: () => void }) {
  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Korean', 'Other']
  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Text size="5" weight="bold">What's your native language?</Text>
          <Text size="2" color="gray">We'll use this to tailor explanations and detect L1 interference patterns.</Text>
        </Flex>
        <RadioCards.Root value={nativeLanguage} onValueChange={onNativeLanguageChange} columns={{ initial: '2', sm: '2' }}>
          {languages.map((lang) => (
            <RadioCards.Item key={lang} value={lang}><Text weight="medium">{lang}</Text></RadioCards.Item>
          ))}
        </RadioCards.Root>
        <Separator size="4" />
        <Flex direction="column" gap="2">
          <Text size="5" weight="bold">Target language</Text>
          <Card variant="surface">
            <Flex align="center" gap="3" p="1">
              <Text size="6">🇯🇵</Text>
              <Flex direction="column">
                <Text weight="medium">Japanese</Text>
                <Text size="1" color="gray">More languages coming in future versions</Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
        <Flex gap="3" justify="between">
          <Button variant="soft" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          <Button onClick={onNext}>Continue <ChevronRight size={16} /></Button>
        </Flex>
      </Flex>
    </Card>
  )
}

// ── Level ──

function LevelStep({ onSelect, onBack }: { onSelect: (l: SelfReportedLevel) => void; onBack: () => void }) {
  const levels: Array<{ value: SelfReportedLevel; label: string; description: string }> = [
    { value: 'beginner', label: 'Complete Beginner', description: 'Just starting out, little to no Japanese knowledge' },
    { value: 'N5', label: 'JLPT N5', description: 'Basic phrases, hiragana/katakana, ~100 kanji' },
    { value: 'N4', label: 'JLPT N4', description: 'Simple conversations, ~300 kanji, basic grammar' },
    { value: 'N3', label: 'JLPT N3', description: 'Everyday situations, ~600 kanji, intermediate grammar' },
    { value: 'N2', label: 'JLPT N2', description: 'Complex texts, ~1000 kanji, advanced grammar' },
    { value: 'N1', label: 'JLPT N1', description: 'Near-native comprehension, ~2000 kanji' },
  ]
  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Target size={20} color="var(--accent-11)" />
            <Text size="5" weight="bold">What's your current level?</Text>
          </Flex>
          <Text size="2" color="gray">Don't worry about being exact — we'll fine-tune this with a few challenges next.</Text>
        </Flex>
        <Flex direction="column" gap="2">
          {levels.map((level) => (
            <div
              key={level.value}
              onClick={() => onSelect(level.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(level.value) } }}
              style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', background: 'var(--color-surface)', transition: 'border-color 0.15s ease, background 0.15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-8)'; e.currentTarget.style.background = 'var(--accent-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray-6)'; e.currentTarget.style.background = 'var(--color-surface)' }}
            >
              <Flex align="center" justify="between" gap="3">
                <Flex direction="column" gap="1">
                  <Text weight="medium">{level.label}</Text>
                  <Text size="1" color="gray">{level.description}</Text>
                </Flex>
                <ChevronRight size={16} color="var(--gray-8)" />
              </Flex>
            </div>
          ))}
        </Flex>
        <Button variant="soft" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          <ChevronLeft size={16} /> Back
        </Button>
      </Flex>
    </Card>
  )
}

// ── Vocabulary Assessment (tap what you know) ──

function AssessmentStep({
  items, knownItems, loading, onToggle, onNext, onBack,
}: { items: AssessmentItem[]; knownItems: Set<number>; loading: boolean; onToggle: (i: number) => void; onNext: () => void; onBack: () => void }) {
  const vocabItems = items.filter((i) => i.type === 'vocabulary')
  const grammarItems = items.filter((i) => i.type === 'grammar')
  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <BookOpen size={20} color="var(--accent-11)" />
            <Text size="5" weight="bold">Quick Vocabulary Check</Text>
          </Flex>
          <Text size="2" color="gray">Tap the items you already know. This helps us build your initial knowledge map.</Text>
        </Flex>
        {loading ? (
          <Flex align="center" justify="center" py="6"><Text color="gray">Loading assessment...</Text></Flex>
        ) : (
          <>
            {vocabItems.length > 0 && (
              <Flex direction="column" gap="3">
                <Text size="3" weight="medium" color="gray">Vocabulary</Text>
                <Flex gap="2" wrap="wrap">
                  {vocabItems.map((item) => {
                    const isKnown = knownItems.has(item.index)
                    return (
                      <Button key={item.index} variant={isKnown ? 'solid' : 'outline'} size="2" onClick={() => onToggle(item.index)} style={{ cursor: 'pointer', transition: 'all 0.15s ease', padding: '12px 16px', height: 'auto' }}>
                        {isKnown && <Check size={14} />}
                        <Flex direction="column" align="start" gap="1">
                          <Text size="2" weight="medium">{item.surfaceForm}</Text>
                          <Text size="1" style={{ opacity: 0.7 }}>{item.meaning}</Text>
                        </Flex>
                      </Button>
                    )
                  })}
                </Flex>
              </Flex>
            )}
            {grammarItems.length > 0 && (
              <Flex direction="column" gap="3">
                <Text size="3" weight="medium" color="gray">Grammar Patterns</Text>
                <Flex gap="2" wrap="wrap">
                  {grammarItems.map((item) => {
                    const isKnown = knownItems.has(item.index)
                    return (
                      <Button key={item.index} variant={isKnown ? 'solid' : 'outline'} size="2" onClick={() => onToggle(item.index)} style={{ cursor: 'pointer', transition: 'all 0.15s ease', padding: '12px 16px', height: 'auto' }}>
                        {isKnown && <Check size={14} />}
                        <Flex direction="column" align="start" gap="1">
                          <Text size="2" weight="medium">{item.surfaceForm}</Text>
                          <Text size="1" style={{ opacity: 0.7 }}>{item.meaning}</Text>
                        </Flex>
                      </Button>
                    )
                  })}
                </Flex>
              </Flex>
            )}
            <Text size="1" color="gray" align="center">{knownItems.size} of {items.length} items marked as known</Text>
          </>
        )}
        <Flex gap="3" justify="between">
          <Button variant="soft" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          <Button onClick={onNext}>Continue <ChevronRight size={16} /></Button>
        </Flex>
      </Flex>
    </Card>
  )
}

// ── Reading Challenge (kanji → hiragana) ──

function ReadingChallengeStep({
  items, loading, onComplete, onBack,
}: {
  items: ReadingChallengeItem[]
  loading: boolean
  onComplete: (results: ReadingChallengeResult[]) => void
  onBack: () => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<ReadingChallengeResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const assessmentItems = items.length > 0
    ? items
    : []

  useEffect(() => {
    setCurrentIdx(0)
    setResults([])
    setUserInput('')
    setChecked(false)
  }, [items])

  useEffect(() => {
    if (!checked && inputRef.current) inputRef.current.focus()
  }, [currentIdx, checked])

  if (loading || assessmentItems.length === 0) {
    return (
      <Card size="4" style={{ width: '100%' }}>
        <Flex align="center" justify="center" py="6"><Text color="gray">Loading reading challenge...</Text></Flex>
      </Card>
    )
  }

  const current = assessmentItems[currentIdx]
  const isLast = currentIdx === assessmentItems.length - 1

  const handleCheck = () => {
    if (!current) return
    const correctReading = getCorrectReading(current.surfaceForm, items)
    const normalized = userInput.trim()
    const isCorrect = normalized === correctReading
    setChecked(true)
    setResults((prev) => [
      ...prev,
      { surfaceForm: current.surfaceForm, userAnswer: normalized, correct: isCorrect, level: current.level },
    ])
  }

  const handleNext = () => {
    if (isLast) {
      const finalResults = results
      onComplete(finalResults)
    } else {
      setCurrentIdx((i) => i + 1)
      setUserInput('')
      setChecked(false)
    }
  }

  const correctReading = checked ? getCorrectReading(current.surfaceForm, items) : null
  const lastResult = results.length > 0 ? results[results.length - 1] : null

  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Keyboard size={20} color="var(--accent-11)" />
            <Text size="5" weight="bold">Reading Challenge</Text>
          </Flex>
          <Text size="2" color="gray">
            Type the hiragana reading for each word. Use a Japanese keyboard input.
          </Text>
          <Text
            size="1"
            color="gray"
            onClick={() => onComplete([])}
            style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            No Japanese keyboard? Skip this step
          </Text>
        </Flex>

        <Text size="1" color="gray" align="center">
          {currentIdx + 1} of {assessmentItems.length}
        </Text>

        <Flex direction="column" align="center" gap="4" py="2">
          <Text size="8" weight="bold" style={{ letterSpacing: '0.05em' }}>
            {current.surfaceForm}
          </Text>
          <Text size="2" color="gray">{current.meaning}</Text>

          <TextField.Root
            ref={inputRef}
            placeholder="ひらがなで入力..."
            value={userInput}
            onChange={(e) => { if (!checked) setUserInput(e.target.value) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!checked && userInput.trim()) handleCheck()
                else if (checked) handleNext()
              }
            }}
            readOnly={checked}
            size="3"
            style={{ width: '100%', maxWidth: 300, textAlign: 'center', fontSize: '1.1rem', opacity: checked ? 0.6 : 1 }}
          />

          {checked && correctReading && (
            <Flex align="center" gap="2">
              {lastResult?.correct ? (
                <Badge size="2" color="green"><Check size={14} /> Correct!</Badge>
              ) : (
                <Flex direction="column" align="center" gap="1">
                  <Badge size="2" color="red"><X size={14} /> Incorrect</Badge>
                  <Text size="2" color="gray">Correct reading: <Text weight="bold">{correctReading}</Text></Text>
                </Flex>
              )}
            </Flex>
          )}
        </Flex>

        <Flex gap="3" justify="between">
          <Button variant="soft" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          {!checked ? (
            <Button onClick={handleCheck} disabled={!userInput.trim()}>
              Check
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {isLast ? 'Continue' : 'Next'} <ChevronRight size={16} />
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  )
}

function getCorrectReading(surfaceForm: string, items: ReadingChallengeItem[]): string {
  const fullList = [
    { surfaceForm: '食べる', reading: 'たべる' }, { surfaceForm: '飲む', reading: 'のむ' },
    { surfaceForm: '行く', reading: 'いく' }, { surfaceForm: '見る', reading: 'みる' },
    { surfaceForm: '水', reading: 'みず' }, { surfaceForm: '友達', reading: 'ともだち' },
    { surfaceForm: '学校', reading: 'がっこう' }, { surfaceForm: '大きい', reading: 'おおきい' },
    { surfaceForm: '新しい', reading: 'あたらしい' }, { surfaceForm: '先生', reading: 'せんせい' },
    { surfaceForm: '経験', reading: 'けいけん' }, { surfaceForm: '届ける', reading: 'とどける' },
    { surfaceForm: '趣味', reading: 'しゅみ' }, { surfaceForm: '予約', reading: 'よやく' },
    { surfaceForm: '変わる', reading: 'かわる' }, { surfaceForm: '将来', reading: 'しょうらい' },
    { surfaceForm: '比べる', reading: 'くらべる' }, { surfaceForm: '習慣', reading: 'しゅうかん' },
    { surfaceForm: '影響', reading: 'えいきょう' }, { surfaceForm: '状況', reading: 'じょうきょう' },
    { surfaceForm: '環境', reading: 'かんきょう' }, { surfaceForm: '適切', reading: 'てきせつ' },
    { surfaceForm: '評価', reading: 'ひょうか' }, { surfaceForm: '発展', reading: 'はってん' },
    { surfaceForm: '管理', reading: 'かんり' }, { surfaceForm: '貢献', reading: 'こうけん' },
    { surfaceForm: '概念', reading: 'がいねん' }, { surfaceForm: '把握', reading: 'はあく' },
    { surfaceForm: '促進', reading: 'そくしん' }, { surfaceForm: '維持', reading: 'いじ' },
    { surfaceForm: '妥協', reading: 'だきょう' }, { surfaceForm: '抽象的', reading: 'ちゅうしょうてき' },
    { surfaceForm: '顕著', reading: 'けんちょ' }, { surfaceForm: '齟齬', reading: 'そご' },
    { surfaceForm: '蓋然性', reading: 'がいぜんせい' }, { surfaceForm: '踏襲', reading: 'とうしゅう' },
  ]
  return fullList.find((i) => i.surfaceForm === surfaceForm)?.reading ?? ''
}

// ── Comprehension Challenge (sentence → translation) ──

const COMPREHENSION_KEYWORDS: Record<string, string[]> = {
  '私は毎日学校に行きます。': ['school', 'go', 'every'],
  'この水はとても冷たいです。': ['water', 'cold'],
  '友達と一緒に映画を見ました。': ['friend', 'movie', 'watch'],
  '将来の夢について友達と話しました。': ['future', 'dream', 'friend', 'talk'],
  '趣味を変えることは難しくありません。': ['hobby', 'change', 'difficult'],
  '予約しないとレストランに入れません。': ['reservation', 'restaurant'],
  '環境問題は私たちの生活に大きな影響を与えています。': ['environment', 'life', 'impact', 'influence', 'effect'],
  '状況に応じて適切な判断をすることが大切です。': ['situation', 'appropriate', 'judgment', 'decision', 'important'],
  '抽象的な概念を把握するには具体的な例が必要だ。': ['abstract', 'concept', 'grasp', 'understand', 'example', 'concrete'],
  '妥協せずに品質を維持することが重要です。': ['compromise', 'quality', 'maintain', 'important'],
  '彼の顕著な業績にもかかわらず、その貢献は十分に評価されていない。': ['remarkable', 'achievement', 'despite', 'contribution', 'evaluate'],
  '蓋然性の高い仮説を踏襲することで研究の効率が上がる。': ['probability', 'hypothesis', 'follow', 'research', 'efficiency'],
}

function computeKeywordMatchRate(sentence: string, userTranslation: string): number {
  const keywords = COMPREHENSION_KEYWORDS[sentence]
  if (!keywords || keywords.length === 0) return 0
  const lower = userTranslation.toLowerCase()
  const matched = keywords.filter((kw) => lower.includes(kw)).length
  return matched / keywords.length
}

const COMPREHENSION_TRANSLATIONS: Record<string, string> = {
  '私は毎日学校に行きます。': 'I go to school every day.',
  'この水はとても冷たいです。': 'This water is very cold.',
  '友達と一緒に映画を見ました。': 'I watched a movie with a friend.',
  '将来の夢について友達と話しました。': 'I talked with my friend about my future dream.',
  '趣味を変えることは難しくありません。': "Changing hobbies isn't difficult.",
  '予約しないとレストランに入れません。': "You can't get into the restaurant without a reservation.",
  '環境問題は私たちの生活に大きな影響を与えています。': 'Environmental problems are having a big impact on our lives.',
  '状況に応じて適切な判断をすることが大切です。': 'It is important to make appropriate judgments depending on the situation.',
  '抽象的な概念を把握するには具体的な例が必要だ。': 'Concrete examples are necessary to grasp abstract concepts.',
  '妥協せずに品質を維持することが重要です。': 'It is important to maintain quality without compromising.',
  '彼の顕著な業績にもかかわらず、その貢献は十分に評価されていない。': 'Despite his remarkable achievements, his contributions have not been adequately evaluated.',
  '蓋然性の高い仮説を踏襲することで研究の効率が上がる。': 'Research efficiency improves by following hypotheses with high probability.',
}

function ComprehensionStep({
  items, loading, onComplete, onBack,
}: {
  items: ComprehensionItem[]
  loading: boolean
  onComplete: (results: ComprehensionResult[]) => void
  onBack: () => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [lastMatchRate, setLastMatchRate] = useState(0)
  const [results, setResults] = useState<ComprehensionResult[]>([])
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrentIdx(0)
    setResults([])
    setUserInput('')
    setChecked(false)
  }, [items])

  useEffect(() => {
    if (!checked && textAreaRef.current) textAreaRef.current.focus()
  }, [currentIdx, checked])

  if (loading || items.length === 0) {
    return (
      <Card size="4" style={{ width: '100%' }}>
        <Flex align="center" justify="center" py="6"><Text color="gray">Loading comprehension challenge...</Text></Flex>
      </Card>
    )
  }

  const current = items[currentIdx]
  const isLast = currentIdx === items.length - 1

  const handleCheck = () => {
    const matchRate = computeKeywordMatchRate(current.sentence, userInput)
    setLastMatchRate(matchRate)
    setChecked(true)
    setResults((prev) => [
      ...prev,
      { sentenceIndex: current.index, userTranslation: userInput.trim(), keywordMatchRate: matchRate, level: current.level },
    ])
  }

  const handleNext = () => {
    if (isLast) {
      onComplete(results)
    } else {
      setCurrentIdx((i) => i + 1)
      setUserInput('')
      setChecked(false)
      setLastMatchRate(0)
    }
  }

  const refTranslation = COMPREHENSION_TRANSLATIONS[current.sentence] ?? ''
  const correctCount = results.filter((r) => r.keywordMatchRate >= 0.5).length

  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <FileText size={20} color="var(--accent-11)" />
            <Text size="5" weight="bold">Comprehension Challenge</Text>
          </Flex>
          <Text size="2" color="gray">
            Translate each Japanese sentence into your native language. We check for key concepts in your answer.
          </Text>
        </Flex>

        <Flex justify="between" align="center">
          <Text size="1" color="gray">{currentIdx + 1} of {items.length}</Text>
          {results.length > 0 && (
            <Text size="1" color="gray">{correctCount} of {results.length} correct so far</Text>
          )}
        </Flex>

        <Flex direction="column" align="center" gap="4" py="2">
          <Card variant="surface" style={{ width: '100%' }}>
            <Flex align="center" justify="center" p="4">
              <Text size="5" weight="medium" align="center" style={{ lineHeight: 1.6 }}>
                {current.sentence}
              </Text>
            </Flex>
          </Card>

          <TextArea
            ref={textAreaRef}
            placeholder="Type your translation..."
            value={userInput}
            onChange={(e) => { if (!checked) setUserInput(e.target.value) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!checked && userInput.trim()) handleCheck()
                else if (checked) handleNext()
              }
            }}
            readOnly={checked}
            size="3"
            style={{ width: '100%', minHeight: 80, opacity: checked ? 0.6 : 1 }}
          />

          {checked && (
            <Flex direction="column" align="center" gap="2" style={{ width: '100%' }}>
              {lastMatchRate >= 0.5 ? (
                <Badge size="2" color="green"><Check size={14} /> Good — you got the key ideas!</Badge>
              ) : lastMatchRate > 0 ? (
                <Badge size="2" color="yellow">Partial — you got some key concepts</Badge>
              ) : (
                <Badge size="2" color="red"><X size={14} /> Needs work</Badge>
              )}
              <Text size="1" color="gray">Reference translation:</Text>
              <Text size="2" weight="medium" align="center" style={{ fontStyle: 'italic' }}>
                {refTranslation}
              </Text>
            </Flex>
          )}
        </Flex>

        <Flex gap="3" justify="between">
          <Button variant="soft" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          {!checked ? (
            <Button onClick={handleCheck} disabled={!userInput.trim()}>
              Check
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {isLast ? 'Continue' : 'Next'} <ChevronRight size={16} />
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  )
}

// ── Preferences ──

function PreferencesStep({
  dailyNewItemLimit, onDailyLimitChange, onNext, onBack,
}: { dailyNewItemLimit: number; onDailyLimitChange: (l: number) => void; onNext: () => void; onBack: () => void }) {
  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" gap="5" p="4">
        <Flex direction="column" gap="2">
          <Text size="5" weight="bold">Study Preferences</Text>
          <Text size="2" color="gray">You can always change these later in Settings.</Text>
        </Flex>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text size="3" weight="medium">New items per day</Text>
            <Badge size="2" variant="soft">{dailyNewItemLimit}</Badge>
          </Flex>
          <Slider value={[dailyNewItemLimit]} onValueChange={([v]) => onDailyLimitChange(v)} min={3} max={30} step={1} />
          <Flex justify="between">
            <Text size="1" color="gray">Light (3)</Text>
            <Text size="1" color="gray">Heavy (30)</Text>
          </Flex>
        </Flex>
        <Card variant="surface">
          <Flex direction="column" gap="2" p="2">
            <Text size="2" weight="medium">What this means</Text>
            <Text size="1" color="gray">
              Each day, up to {dailyNewItemLimit} new vocabulary and grammar items will be introduced
              alongside your review queue. A higher number means faster progress but requires more
              daily study time.
            </Text>
          </Flex>
        </Card>
        <Flex gap="3" justify="between">
          <Button variant="soft" onClick={onBack}><ChevronLeft size={16} /> Back</Button>
          <Button onClick={onNext}>Continue <ChevronRight size={16} /></Button>
        </Flex>
      </Flex>
    </Card>
  )
}

// ── Complete ──

function CompleteStep({
  knownCount, totalCount, readingCorrect, readingTotal, comprehensionCount,
  selfReportedLevel, computedLevel, submitting, onComplete, onBack,
}: {
  knownCount: number; totalCount: number; readingCorrect: number; readingTotal: number
  comprehensionCount: number; selfReportedLevel: SelfReportedLevel; computedLevel: string | null
  submitting: boolean; onComplete: () => void; onBack: () => void
}) {
  const levelLabels: Record<SelfReportedLevel, string> = {
    beginner: 'Complete Beginner', N5: 'JLPT N5', N4: 'JLPT N4', N3: 'JLPT N3', N2: 'JLPT N2', N1: 'JLPT N1',
  }
  const ready = computedLevel !== null
  const levelChanged = ready && computedLevel !== getLevelCefrLabel(selfReportedLevel)

  return (
    <Card size="4" style={{ width: '100%' }}>
      <Flex direction="column" align="center" gap="5" p="4">
        <Flex
          align="center" justify="center"
          style={{ width: 64, height: 64, borderRadius: 'var(--radius-4)', background: 'var(--green-3)' }}
        >
          <Sparkles size={32} color="var(--green-11)" />
        </Flex>
        <Flex direction="column" align="center" gap="2">
          <Text size="6" weight="bold">{ready ? "You're all set!" : 'Setting up your profile...'}</Text>
          <Text size="3" color="gray" align="center" style={{ maxWidth: 400 }}>
            {ready
              ? 'Your personalized learning profile has been created. Here\'s a summary:'
              : 'Analyzing your results and building your knowledge map...'}
          </Text>
        </Flex>
        <Card variant="surface" style={{ width: '100%' }}>
          <Flex direction="column" gap="3" p="3">
            <Flex justify="between">
              <Text size="2" color="gray">Self-reported level</Text>
              <Text size="2" weight="medium">{levelLabels[selfReportedLevel]}</Text>
            </Flex>
            <Separator size="4" />
            <Flex justify="between" align="center">
              <Text size="2" color="gray">Computed level</Text>
              {ready ? (
                <Flex align="center" gap="2">
                  <Badge size="2" color={levelChanged ? 'green' : 'blue'}>
                    {computedLevel}
                  </Badge>
                  {levelChanged && (
                    <Text size="1" color="green">Adjusted from challenges</Text>
                  )}
                </Flex>
              ) : (
                <Text size="2" color="gray">Computing...</Text>
              )}
            </Flex>
            <Separator size="4" />
            <Flex justify="between">
              <Text size="2" color="gray">Known items</Text>
              <Text size="2" weight="medium">{knownCount} of {totalCount} assessed</Text>
            </Flex>
            {readingTotal > 0 && (
              <>
                <Separator size="4" />
                <Flex justify="between">
                  <Text size="2" color="gray">Reading challenge</Text>
                  <Text size="2" weight="medium">{readingCorrect} of {readingTotal} correct</Text>
                </Flex>
              </>
            )}
            <Separator size="4" />
            <Flex justify="between">
              <Text size="2" color="gray">Comprehension</Text>
              <Text size="2" weight="medium">{comprehensionCount} sentence{comprehensionCount !== 1 ? 's' : ''} translated</Text>
            </Flex>
            <Separator size="4" />
            <Flex justify="between">
              <Text size="2" color="gray">Target language</Text>
              <Text size="2" weight="medium">Japanese 🇯🇵</Text>
            </Flex>
          </Flex>
        </Card>
        <Flex gap="3" style={{ width: '100%' }} direction="column">
          <Button size="3" onClick={onComplete} disabled={!ready} style={{ width: '100%', cursor: !ready ? 'wait' : 'pointer' }}>
            {ready ? 'Start Learning' : 'Setting up...'}
          </Button>
          <Button variant="soft" onClick={onBack} style={{ width: '100%' }} disabled={submitting}>
            <ChevronLeft size={16} /> Go Back
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}

function getLevelCefrLabel(level: SelfReportedLevel): string {
  const map: Record<SelfReportedLevel, string> = {
    beginner: 'A1', N5: 'A1', N4: 'A2', N3: 'B1', N2: 'B2', N1: 'C1',
  }
  return map[level]
}
