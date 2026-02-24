import { useState } from 'react'
import { Flex, Text, Button, Card, Callout } from '@radix-ui/themes'
import { useAuth } from '../../contexts/auth-context'

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

const isMac = window.platform === 'darwin'

export function SignInPage() {
  const { signInWithGoogle, error } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: '100vh' }}
    >
      {isMac && (
        <div
          className="titlebar-drag-region"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 52,
            zIndex: 1,
          }}
        />
      )}

      <Flex
        direction="column"
        align="center"
        gap="6"
        style={{ maxWidth: 400, width: '100%', padding: 24 }}
      >
        <Flex direction="column" align="center" gap="2">
          <Text size="8" weight="bold" style={{ letterSpacing: '-0.02em' }}>
            Linguist
          </Text>
          <Text size="3" color="gray" align="center">
            Your AI-powered language learning companion
          </Text>
        </Flex>

        <Card size="4" style={{ width: '100%' }}>
          <Flex direction="column" gap="4" align="center" p="2">
            <Text size="4" weight="medium">
              Welcome
            </Text>
            <Text size="2" color="gray" align="center">
              Sign in to access your personalized learning experience
            </Text>

            {error && (
              <Callout.Root color="red" size="1" style={{ width: '100%' }}>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <Button
              size="3"
              variant="outline"
              style={{ width: '100%', cursor: signingIn ? 'wait' : 'pointer' }}
              onClick={handleSignIn}
              disabled={signingIn}
            >
              <GoogleLogo />
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </Button>
          </Flex>
        </Card>

        <Text size="1" color="gray">
          Your data stays on your machine
        </Text>
      </Flex>
    </Flex>
  )
}
