import { Box, Heading, Text, Card, Flex, Button, Separator } from '@radix-ui/themes'
import { Check, X, ArrowRight, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router'
import type { ExpandedSessionPlan, PostSessionAnalysis } from '@shared/types'

interface SessionSummaryProps {
  plan: ExpandedSessionPlan
  analysis: PostSessionAnalysis | null
  durationSeconds: number
  onNewSession: () => void
}

export function SessionSummary({
  plan,
  analysis,
  durationSeconds,
  onNewSession,
}: SessionSummaryProps) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60))

  const plannedVocab = plan.targetVocabulary ?? []
  const plannedGrammar = plan.targetGrammar ?? []
  const allPlanned = [...plannedVocab, ...plannedGrammar]
  const targetsHit = new Set(analysis?.targetsHit ?? [])

  return (
    <Box style={{ maxWidth: 640, margin: '0 auto' }}>
      <Heading size="7" mb="2">
        Session Complete
      </Heading>
      <Text size="3" color="gray" mb="5" style={{ display: 'block' }}>
        Duration: {minutes} minute{minutes !== 1 ? 's' : ''}
      </Text>

      {allPlanned.length > 0 && (
        <Card mb="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium" color="gray">
              Targets
            </Text>
            <Separator size="4" />
            {allPlanned.map((id) => (
              <Flex key={id} align="center" gap="2" py="1">
                {targetsHit.has(id) ? (
                  <Check size={16} style={{ color: 'var(--green-9)' }} />
                ) : (
                  <X size={16} style={{ color: 'var(--red-9)' }} />
                )}
                <Text size="2">
                  Item #{id} {targetsHit.has(id) ? '— produced in context' : '— not encountered'}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {analysis?.errorsLogged && analysis.errorsLogged.length > 0 && (
        <Card mb="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium" color="gray">
              Errors
            </Text>
            <Separator size="4" />
            {analysis.errorsLogged.map((err, i) => (
              <Text key={i} size="2" color="red">
                {err.contextQuote || `Error on item #${err.itemId}: ${err.errorType}`}
              </Text>
            ))}
          </Flex>
        </Card>
      )}

      {analysis?.newItemsEncountered && analysis.newItemsEncountered.length > 0 && (
        <Card mb="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium" color="gray">
              New Items Encountered
            </Text>
            <Separator size="4" />
            {analysis.newItemsEncountered.map((item, i) => (
              <Text key={i} size="2">
                {item.surfaceForm}
                {item.contextQuote && (
                  <Text color="gray"> — {item.contextQuote}</Text>
                )}
              </Text>
            ))}
          </Flex>
        </Card>
      )}

      {analysis?.overallAssessment && (
        <Card mb="5">
          <Text size="2" color="gray">
            {analysis.overallAssessment}
          </Text>
        </Card>
      )}

      <Flex gap="3" justify="end">
        <Button variant="soft" color="gray" asChild>
          <Link to="/dashboard">
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </Button>
        <Button onClick={onNewSession}>
          Start New Session
          <ArrowRight size={14} />
        </Button>
      </Flex>
    </Box>
  )
}
