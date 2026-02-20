import { Box, Heading, Text } from '@radix-ui/themes'
import { useWordbank } from '../../hooks/use-wordbank'

export function KnowledgePage() {
  const { items, isLoading } = useWordbank()

  if (isLoading) {
    return (
      <Box>
        <Heading size="7" mb="4">Knowledge Base</Heading>
        <Text>Loading knowledge base...</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size="7" mb="4">
        Knowledge Base ({items.length} items)
      </Heading>
      <Text color="gray">Knowledge base UI will be implemented here.</Text>
    </Box>
  )
}
