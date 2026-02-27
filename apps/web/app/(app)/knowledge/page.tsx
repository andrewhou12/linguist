'use client'

import { useState, useCallback } from 'react'
import { TextField, Select, Tabs, Table, Badge } from '@radix-ui/themes'
import { Search, Play } from 'lucide-react'
import { useWordbank } from '@/hooks/use-wordbank'
import { useGrammar } from '@/hooks/use-grammar'
import { useChunks } from '@/hooks/use-chunks'
import { Skeleton } from '@/components/skeleton'
import { MasteryState } from '@linguist/shared/types'
import type { WordBankEntry, WordBankChunkEntry, FsrsState } from '@linguist/shared/types'
import { MASTERY_COLORS, MASTERY_LABELS } from '@/constants/mastery'
import { api } from '@/lib/api'

function MasteryBadge({ state }: { state: string }) {
  return (
    <Badge color={MASTERY_COLORS[state] ?? 'gray'} variant="soft" size="1">
      {MASTERY_LABELS[state] ?? state}
    </Badge>
  )
}

function formatDueDate(fsrs: FsrsState): string {
  const due = new Date(fsrs.due)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due now'
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays}d`
}

function MasteryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    /* Keep Radix Select for now */
    <Select.Root value={value} onValueChange={onChange} size="2">
      <Select.Trigger placeholder="Filter by mastery" />
      <Select.Content>
        <Select.Item value="all">All states</Select.Item>
        <Select.Separator />
        <Select.Item value="unseen">Unseen</Select.Item>
        <Select.Item value="introduced">Introduced</Select.Item>
        <Select.Item value="apprentice_1">Apprentice 1</Select.Item>
        <Select.Item value="apprentice_2">Apprentice 2</Select.Item>
        <Select.Item value="apprentice_3">Apprentice 3</Select.Item>
        <Select.Item value="apprentice_4">Apprentice 4</Select.Item>
        <Select.Item value="journeyman">Journeyman</Select.Item>
        <Select.Item value="expert">Expert</Select.Item>
        <Select.Item value="master">Master</Select.Item>
        <Select.Item value="burned">Burned</Select.Item>
      </Select.Content>
    </Select.Root>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={16} />
          <Skeleton width={140} height={16} />
          <Skeleton width={70} height={20} borderRadius={10} />
          <Skeleton width={60} height={16} />
        </div>
      ))}
    </div>
  )
}

// Vocabulary Tab

function VocabularyTab() {
  const { items, isLoading, search, reload, setFilters } = useWordbank()
  const [searchQuery, setSearchQuery] = useState('')
  const [masteryFilter, setMasteryFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) search(value.trim())
    else reload()
  }

  const handleMasteryFilter = (value: string) => {
    setMasteryFilter(value)
    setSearchQuery('')
    if (value === 'all') setFilters(undefined)
    else setFilters({ masteryState: value as MasteryState })
  }

  const handlePromote = useCallback(async (id: number) => {
    try {
      await api.wordbankPromote(id)
      reload()
    } catch (err) {
      console.error('Failed to promote item:', err)
    }
  }, [reload])

  if (isLoading) return <LoadingSkeleton />

  return (
    <>
      <div className="flex gap-3 mb-4 items-center">
        {/* Keep Radix TextField for now */}
        <TextField.Root
          placeholder="Search by word, reading, or meaning..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
          size="2"
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
        <MasteryFilter value={masteryFilter} onChange={handleMasteryFilter} />
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">No items found.</p>
      ) : (
        /* Keep Radix Table for now */
        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Word</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Reading</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Meaning</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Mastery</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Recognition</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Production</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Stability</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <>
                <Table.Row
                  key={item.id}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Cell><span className="font-medium text-base">{item.surfaceForm}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-gray-500">{item.reading ?? '—'}</span></Table.Cell>
                  <Table.Cell><span className="text-sm">{item.meaning}</span></Table.Cell>
                  <Table.Cell><span className="text-xs text-gray-500">{item.partOfSpeech ?? '—'}</span></Table.Cell>
                  <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                  <Table.Cell>
                    <span className="text-xs text-gray-500">
                      {item.masteryState === 'unseen' || item.masteryState === 'introduced' ? '—' : formatDueDate(item.recognitionFsrs)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-xs text-gray-500">
                      {item.masteryState === 'unseen' || item.masteryState === 'introduced' ? '—' : formatDueDate(item.productionFsrs)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-xs text-gray-500">
                      {item.recognitionFsrs.stability > 0 ? `${Math.round(item.recognitionFsrs.stability)}d` : '—'}
                    </span>
                  </Table.Cell>
                </Table.Row>
                {expandedId === item.id && (
                  <Table.Row key={`${item.id}-detail`}>
                    <Table.Cell colSpan={8}>
                      <ItemDetail item={item} onPromote={handlePromote} />
                    </Table.Cell>
                  </Table.Row>
                )}
              </>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </>
  )
}

function ItemDetail({ item, onPromote }: { item: WordBankEntry; onPromote: (id: number) => void }) {
  const canPromote = item.masteryState === 'unseen' || item.masteryState === 'introduced'
  return (
    <div className="flex gap-4 py-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">First seen</span>
        <span className="text-sm">{new Date(item.firstSeen).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Exposures</span>
        <span className="text-sm">{item.exposureCount}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Productions</span>
        <span className="text-sm">{item.productionCount}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Rec. Stability</span>
        <span className="text-sm">{item.recognitionFsrs.stability > 0 ? `${item.recognitionFsrs.stability.toFixed(1)}d` : '—'}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Prod. Stability</span>
        <span className="text-sm">{item.productionFsrs.stability > 0 ? `${item.productionFsrs.stability.toFixed(1)}d` : '—'}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Difficulty</span>
        <span className="text-sm">{item.recognitionFsrs.difficulty > 0 ? item.recognitionFsrs.difficulty.toFixed(1) : '—'}</span>
      </div>
      {item.tags.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Tags</span>
          <div className="flex gap-1">
            {item.tags.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600">{t}</span>
            ))}
          </div>
        </div>
      )}
      {canPromote && (
        <button
          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          onClick={() => onPromote(item.id)}
        >
          <Play size={12} />
          Start Practicing
        </button>
      )}
    </div>
  )
}

// Grammar Tab

function GrammarTab() {
  const { items, isLoading, search, reload, setFilters } = useGrammar()
  const [searchQuery, setSearchQuery] = useState('')
  const [masteryFilter, setMasteryFilter] = useState('all')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) search(value.trim())
    else reload()
  }

  const handleMasteryFilter = (value: string) => {
    setMasteryFilter(value)
    setSearchQuery('')
    if (value === 'all') setFilters(undefined)
    else setFilters({ masteryState: value })
  }

  const handlePromote = useCallback(async (id: number) => {
    try {
      await api.grammarPromote(id)
      reload()
    } catch (err) {
      console.error('Failed to promote grammar item:', err)
    }
  }, [reload])

  if (isLoading) return <LoadingSkeleton />

  return (
    <>
      <div className="flex gap-3 mb-4 items-center">
        <TextField.Root
          placeholder="Search by pattern or name..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
          size="2"
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
        <MasteryFilter value={masteryFilter} onChange={handleMasteryFilter} />
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">No grammar items found.</p>
      ) : (
        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Pattern</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Level</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Mastery</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Contexts</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Prod. Weight</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => {
              const canPromote = item.masteryState === 'unseen' || item.masteryState === 'introduced'
              return (
                <Table.Row key={item.id}>
                  <Table.Cell><span className="font-medium text-sm">{item.patternId}</span></Table.Cell>
                  <Table.Cell><span className="text-sm">{item.name}</span></Table.Cell>
                  <Table.Cell><span className="text-xs text-gray-500">{item.cefrLevel ?? '—'}</span></Table.Cell>
                  <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                  <Table.Cell><span className="text-xs text-gray-500">{item.contextCount}</span></Table.Cell>
                  <Table.Cell><span className="text-xs text-gray-500">{item.productionWeight.toFixed(1)}</span></Table.Cell>
                  <Table.Cell>
                    {canPromote && (
                      <button
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                        onClick={() => handlePromote(item.id)}
                      >
                        <Play size={12} />
                      </button>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      )}
    </>
  )
}

// Phrases Tab

function PhrasesTab() {
  const { items, isLoading, search, reload, setFilters } = useChunks()
  const [searchQuery, setSearchQuery] = useState('')
  const [masteryFilter, setMasteryFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) search(value.trim())
    else reload()
  }

  const handleMasteryFilter = (value: string) => {
    setMasteryFilter(value)
    setSearchQuery('')
    const f: Record<string, string | undefined> = {}
    if (value !== 'all') f.masteryState = value
    if (kindFilter !== 'all') f.itemKind = kindFilter
    setFilters(Object.keys(f).length > 0 ? f : undefined)
  }

  const handleKindFilter = (value: string) => {
    setKindFilter(value)
    setSearchQuery('')
    const f: Record<string, string | undefined> = {}
    if (masteryFilter !== 'all') f.masteryState = masteryFilter
    if (value !== 'all') f.itemKind = value
    setFilters(Object.keys(f).length > 0 ? f : undefined)
  }

  if (isLoading) return <LoadingSkeleton />

  const kindLabels: Record<string, string> = {
    collocation: 'Collocation',
    chunk: 'Chunk',
    pragmatic_formula: 'Pragmatic',
  }

  const kindColors: Record<string, string> = {
    collocation: 'bg-blue-50 text-blue-700',
    chunk: 'bg-green-50 text-green-700',
    pragmatic_formula: 'bg-purple-50 text-purple-700',
  }

  return (
    <>
      <div className="flex gap-3 mb-4 items-center">
        <TextField.Root
          placeholder="Search phrases..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
          size="2"
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
        <MasteryFilter value={masteryFilter} onChange={handleMasteryFilter} />
        <Select.Root value={kindFilter} onValueChange={handleKindFilter} size="2">
          <Select.Trigger placeholder="Type" />
          <Select.Content>
            <Select.Item value="all">All types</Select.Item>
            <Select.Separator />
            <Select.Item value="collocation">Collocations</Select.Item>
            <Select.Item value="chunk">Chunks</Select.Item>
            <Select.Item value="pragmatic_formula">Pragmatic</Select.Item>
          </Select.Content>
        </Select.Root>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">No phrases found.</p>
      ) : (
        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Phrase</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Reading</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Meaning</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Register</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Mastery</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Level</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell><span className="font-medium text-base">{item.phrase}</span></Table.Cell>
                <Table.Cell><span className="text-sm text-gray-500">{item.reading ?? '—'}</span></Table.Cell>
                <Table.Cell><span className="text-sm">{item.meaning}</span></Table.Cell>
                <Table.Cell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kindColors[item.itemKind] ?? 'bg-gray-100 text-gray-700'}`}>
                    {kindLabels[item.itemKind] ?? item.itemKind}
                  </span>
                </Table.Cell>
                <Table.Cell><span className="text-xs text-gray-500">{item.register ?? '—'}</span></Table.Cell>
                <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                <Table.Cell><span className="text-xs text-gray-500">{item.cefrLevel ?? '—'}</span></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </>
  )
}

// Main Page

export default function KnowledgePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Knowledge Base</h1>

      {/* Keep Radix Tabs for now */}
      <Tabs.Root defaultValue="vocabulary">
        <Tabs.List className="mb-4">
          <Tabs.Trigger value="vocabulary">Vocabulary</Tabs.Trigger>
          <Tabs.Trigger value="grammar">Grammar</Tabs.Trigger>
          <Tabs.Trigger value="phrases">Phrases</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="vocabulary">
          <VocabularyTab />
        </Tabs.Content>
        <Tabs.Content value="grammar">
          <GrammarTab />
        </Tabs.Content>
        <Tabs.Content value="phrases">
          <PhrasesTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
