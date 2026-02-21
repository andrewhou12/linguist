import { NavLink } from 'react-router'
import { Box, Flex, Text } from '@radix-ui/themes'
import type { CSSProperties, ReactNode } from 'react'
import {
  LayoutDashboard,
  RotateCcw,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from './user-menu'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/review', label: 'Review', icon: RotateCcw },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
]

const navLinkStyle = (isActive: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 'var(--radius-2)',
  textDecoration: 'none',
  color: isActive ? 'var(--accent-11)' : 'var(--gray-11)',
  backgroundColor: isActive ? 'var(--accent-3)' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  WebkitAppRegion: 'no-drag',
})

const isMac = window.platform === 'darwin'
const TITLEBAR_HEIGHT = 52

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Flex style={{ height: '100vh' }}>
      <nav
        style={{
          width: 240,
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
        <div style={{ padding: 16, paddingTop: isMac ? 0 : 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Text size="5" weight="bold" mb="4" asChild>
            <h1 style={{ margin: 0 }}>Linguist</h1>
          </Text>
          <Flex direction="column" gap="1" mt="4" style={{ flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => navLinkStyle(isActive)}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </Flex>

          {/* Settings at bottom */}
          <NavLink
            to="/settings"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </nav>

      <Flex
        direction="column"
        style={{ flex: 1, overflow: 'hidden' }}
      >
        {/* Top bar with user menu */}
        <Flex
          align="center"
          justify="end"
          px="6"
          style={{
            height: isMac ? TITLEBAR_HEIGHT : 48,
            flexShrink: 0,
            WebkitAppRegion: isMac ? 'drag' : undefined,
          } as CSSProperties}
        >
          <Box style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
            <UserMenu />
          </Box>
        </Flex>

        <Box
          px="6"
          pb="6"
          style={{ flex: 1, overflow: 'auto' }}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
