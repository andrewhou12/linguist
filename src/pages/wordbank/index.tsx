import { Box, Heading, Text } from '@radix-ui/themes'
import { useWordbank } from '../../hooks/use-wordbank'

export function WordBankPage() {
  const { items, isLoading } = useWordbank()

  if (isLoading) {
    return (
      <Box>
        <Heading size="7" mb="4">Word Bank</Heading>
        <Text>Loading word bank...</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size="7" mb="4">
        Word Bank ({items.length} items)
      </Heading>
      <Text color="gray">Word bank UI will be implemented here.</Text>
    </Box>
  )
}
