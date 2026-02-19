import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { AppShell } from './components/app-shell'
import { DashboardPage } from './pages/dashboard'
import { ReviewPage } from './pages/review'
import { ConversationPage } from './pages/conversation'
import { WordBankPage } from './pages/wordbank'
import { InsightsPage } from './pages/insights'

export function App() {
  return (
    <Theme appearance="dark" accentColor="blue" radius="medium">
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/conversation" element={<ConversationPage />} />
            <Route path="/wordbank" element={<WordBankPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </Theme>
  )
}
