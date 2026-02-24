import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@linguist/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure DB user exists (same upsert logic as desktop auth.ts)
      await prisma.user.upsert({
        where: { id: data.user.id },
        create: {
          id: data.user.id,
          email: data.user.email ?? null,
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          updatedAt: new Date(),
        },
        update: {
          email: data.user.email ?? null,
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        },
      })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`)
}
