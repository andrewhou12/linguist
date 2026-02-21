import { useState } from 'react'
import {
  Box,
  Heading,
  Text,
  Flex,
  TextField,
  Badge,
  Table,
  Select,
} from '@radix-ui/themes'
import { Search } from 'lucide-react'
import { useWordbank } from '../../hooks/use-wordbank'
import { Skeleton } from '../../components/skeleton'
import { MasteryState } from '@shared/types'
import type { WordBankEntry } from '@shared/types'
import { MASTERY_COLORS, MASTERY_LABELS } from '../../constants/mastery'

function MasteryBadge({ state }: { state: string }) {
  return (
    <Badge color={MASTERY_COLORS[state] ?? 'gray'} variant="soft" size="1">
      {MASTERY_LABELS[state] ?? state}
    </Badge>
  )
}

function formatDueDate(fsrs: WordBankEntry['recognitionFsrs']): string {
  const due = new Date(fsrs.due)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due now'
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays}d`
}

export function KnowledgePage() {
  const { items, isLoading, search, reload, setFilters } = useWordbank()
  const [searchQuery, setSearchQuery] = useState('')
  const [masteryFilter, setMasteryFilter] = useState('all')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      search(value.trim())
    } else {
      reload()
    }
  }

  const handleMasteryFilter = (value: string) => {
    setMasteryFilter(value)
    setSearchQuery('')
    if (value === 'all') {
      setFilters(undefined)
    } else {
      setFilters({ masteryState: value as MasteryState })
    }
  }

  if (isLoading) {
    return (
      <Box>
        <Heading size="7" mb="4">Knowledge Base</Heading>
        <Flex direction="column" gap="3" mt="4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Flex key={i} gap="4" align="center">
              <Skeleton width={80} height={16} />
              <Skeleton width={60} height={16} />
              <Skeleton width={140} height={16} />
              <Skeleton width={50} height={16} />
              <Skeleton width={70} height={20} borderRadius={10} />
              <Skeleton width={60} height={16} />
              <Skeleton width={40} height={16} />
            </Flex>
          ))}
        </Flex>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size="7" mb="4">
        Knowledge Base
      </Heading>

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

        <Select.Root value={masteryFilter} onValueChange={handleMasteryFilter} size="2">
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

        <Text size="2" color="gray">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
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
              <Table.ColumnHeaderCell>Stability</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>
                  <Text weight="medium" size="3">{item.surfaceForm}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">{item.reading ?? '—'}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">{item.meaning}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="1" color="gray">{item.partOfSpeech ?? '—'}</Text>
                </Table.Cell>
                <Table.Cell>
                  <MasteryBadge state={item.masteryState} />
                </Table.Cell>
                <Table.Cell>
                  <Text size="1" color="gray">
                    {item.masteryState === 'unseen' || item.masteryState === 'introduced'
                      ? '—'
                      : formatDueDate(item.recognitionFsrs)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="1" color="gray">
                    {item.recognitionFsrs.stability > 0
                      ? `${Math.round(item.recognitionFsrs.stability)}d`
                      : '—'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}
