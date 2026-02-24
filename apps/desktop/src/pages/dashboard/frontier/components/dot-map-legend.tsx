import { Box, Flex, Text } from '@radix-ui/themes'

export function DotMapLegend() {
  return (
    <Flex gap="4" align="center">
      <Flex align="center" gap="1">
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-9)',
          }}
        />
        <Text size="1" color="gray">
          Vocabulary
        </Text>
      </Flex>
      <Flex align="center" gap="1">
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--purple-9)',
          }}
        />
        <Text size="1" color="gray">
          Grammar
        </Text>
      </Flex>
    </Flex>
  )
}
