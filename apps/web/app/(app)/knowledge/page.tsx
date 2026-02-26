'use client'

import { useState, useCallback } from 'react'
import { Box, Heading, Text, Flex, TextField, Badge, Table, Select, Tabs, Button } from '@radix-ui/themes'
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
    <Flex direction="column" gap="3" mt="4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Flex key={i} gap="4" align="center">
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={16} />
          <Skeleton width={140} height={16} />
          <Skeleton width={70} height={20} borderRadius={10} />
          <Skeleton width={60} height={16} />
        </Flex>
      ))}
    </Flex>
  )
}

// ── Vocabulary Tab ──

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
      <Flex gap="3" mb="4" align="center">
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
        <Text size="2" color="gray">{items.length} items</Text>
      </Flex>

      {items.length === 0 ? (
        <Text color="gray">No items found.</Text>
      ) : (
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
                  <Table.Cell><Text weight="medium" size="3">{item.surfaceForm}</Text></Table.Cell>
                  <Table.Cell><Text size="2" color="gray">{item.reading ?? '—'}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{item.meaning}</Text></Table.Cell>
                  <Table.Cell><Text size="1" color="gray">{item.partOfSpeech ?? '—'}</Text></Table.Cell>
                  <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {item.masteryState === 'unseen' || item.masteryState === 'introduced' ? '—' : formatDueDate(item.recognitionFsrs)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {item.masteryState === 'unseen' || item.masteryState === 'introduced' ? '—' : formatDueDate(item.productionFsrs)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {item.recognitionFsrs.stability > 0 ? `${Math.round(item.recognitionFsrs.stability)}d` : '—'}
                    </Text>
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
    <Flex gap="4" py="2" wrap="wrap">
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">First seen</Text>
        <Text size="2">{new Date(item.firstSeen).toLocaleDateString()}</Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">Exposures</Text>
        <Text size="2">{item.exposureCount}</Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">Productions</Text>
        <Text size="2">{item.productionCount}</Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">Rec. Stability</Text>
        <Text size="2">{item.recognitionFsrs.stability > 0 ? `${item.recognitionFsrs.stability.toFixed(1)}d` : '—'}</Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">Prod. Stability</Text>
        <Text size="2">{item.productionFsrs.stability > 0 ? `${item.productionFsrs.stability.toFixed(1)}d` : '—'}</Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">Difficulty</Text>
        <Text size="2">{item.recognitionFsrs.difficulty > 0 ? item.recognitionFsrs.difficulty.toFixed(1) : '—'}</Text>
      </Flex>
      {item.tags.length > 0 && (
        <Flex direction="column" gap="1">
          <Text size="1" color="gray">Tags</Text>
          <Flex gap="1">{item.tags.map((t) => <Badge key={t} size="1" variant="outline">{t}</Badge>)}</Flex>
        </Flex>
      )}
      {canPromote && (
        <Button size="1" variant="soft" onClick={() => onPromote(item.id)}>
          <Play size={12} />
          Start Practicing
        </Button>
      )}
    </Flex>
  )
}

// ── Grammar Tab ──

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
      <Flex gap="3" mb="4" align="center">
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
        <Text size="2" color="gray">{items.length} items</Text>
      </Flex>

      {items.length === 0 ? (
        <Text color="gray">No grammar items found.</Text>
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
                  <Table.Cell><Text weight="medium" size="2">{item.patternId}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{item.name}</Text></Table.Cell>
                  <Table.Cell><Text size="1" color="gray">{item.cefrLevel ?? '—'}</Text></Table.Cell>
                  <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                  <Table.Cell><Text size="1" color="gray">{item.contextCount}</Text></Table.Cell>
                  <Table.Cell><Text size="1" color="gray">{item.productionWeight.toFixed(1)}</Text></Table.Cell>
                  <Table.Cell>
                    {canPromote && (
                      <Button size="1" variant="ghost" onClick={() => handlePromote(item.id)}>
                        <Play size={12} />
                      </Button>
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

// ── Phrases Tab ──

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

  const kindColors: Record<string, 'blue' | 'green' | 'purple'> = {
    collocation: 'blue',
    chunk: 'green',
    pragmatic_formula: 'purple',
  }

  return (
    <>
      <Flex gap="3" mb="4" align="center">
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
        <Text size="2" color="gray">{items.length} items</Text>
      </Flex>

      {items.length === 0 ? (
        <Text color="gray">No phrases found.</Text>
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
                <Table.Cell><Text weight="medium" size="3">{item.phrase}</Text></Table.Cell>
                <Table.Cell><Text size="2" color="gray">{item.reading ?? '—'}</Text></Table.Cell>
                <Table.Cell><Text size="2">{item.meaning}</Text></Table.Cell>
                <Table.Cell>
                  <Badge size="1" variant="soft" color={kindColors[item.itemKind] ?? 'gray'}>
                    {kindLabels[item.itemKind] ?? item.itemKind}
                  </Badge>
                </Table.Cell>
                <Table.Cell><Text size="1" color="gray">{item.register ?? '—'}</Text></Table.Cell>
                <Table.Cell><MasteryBadge state={item.masteryState} /></Table.Cell>
                <Table.Cell><Text size="1" color="gray">{item.cefrLevel ?? '—'}</Text></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </>
  )
}

// ── Main Page ──

export default function KnowledgePage() {
  return (
    <Box>
      <Heading size="7" mb="4">Knowledge Base</Heading>

      <Tabs.Root defaultValue="vocabulary">
        <Tabs.List mb="4">
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
    </Box>
  )
}
