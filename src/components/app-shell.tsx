import { NavLink } from 'react-router'
import { Box, Flex, Text } from '@radix-ui/themes'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/review', label: 'Review' },
  { to: '/conversation', label: 'Conversation' },
  { to: '/wordbank', label: 'Word Bank' },
  { to: '/insights', label: 'Insights' },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Flex style={{ height: '100vh' }}>
      <Box
        asChild
        p="4"
        style={{
          width: 200,
          borderRight: '1px solid var(--gray-6)',
          flexShrink: 0,
        }}
      >
        <nav>
          <Text size="5" weight="bold" mb="4" asChild>
            <h1>Linguist</h1>
          </Text>
          <Flex direction="column" gap="1" mt="4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-2)',
                  textDecoration: 'none',
                  color: isActive
                    ? 'var(--accent-11)'
                    : 'var(--gray-11)',
                  backgroundColor: isActive
                    ? 'var(--accent-3)'
                    : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </Flex>
        </nav>
      </Box>
      <Box p="6" style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Flex>
  )
}
