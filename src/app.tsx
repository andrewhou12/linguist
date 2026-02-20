import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { AppShell } from './components/app-shell'
import { DashboardPage } from './pages/dashboard'
import { ReviewPage } from './pages/review'
import { LearnPage } from './pages/learn'
import { KnowledgePage } from './pages/knowledge'
import { ChatPage } from './pages/chat'

export function App() {
  return (
    <Theme appearance="dark" accentColor="blue" radius="medium">
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </Theme>
  )
}
