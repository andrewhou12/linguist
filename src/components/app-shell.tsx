import { NavLink } from 'react-router'
import { Box, Flex, Text } from '@radix-ui/themes'
import type { CSSProperties, ReactNode } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/review', label: 'Review' },
  { to: '/conversation', label: 'Conversation' },
  { to: '/wordbank', label: 'Word Bank' },
  { to: '/insights', label: 'Insights' },
] as const

const isMac = window.platform === 'darwin'
const TITLEBAR_HEIGHT = 52

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Flex style={{ height: '100vh' }}>
      <nav
        style={{
          width: 200,
          borderRight: '1px solid var(--gray-6)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isMac && (
          <div
            className="titlebar-drag-region"
            style={{ height: TITLEBAR_HEIGHT, flexShrink: 0 }}
          />
        )}
        <div style={{ padding: 16, paddingTop: isMac ? 0 : 16, flex: 1 }}>
          <Text size="5" weight="bold" mb="4" asChild>
            <h1 style={{ margin: 0 }}>Linguist</h1>
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
                  WebkitAppRegion: 'no-drag',
                } as CSSProperties)}
              >
                {item.label}
              </NavLink>
            ))}
          </Flex>
        </div>
      </nav>
      <Box
        p="6"
        style={{
          flex: 1,
          overflow: 'auto',
          paddingTop: isMac ? TITLEBAR_HEIGHT : undefined,
        }}
      >
        {children}
      </Box>
    </Flex>
  )
}
