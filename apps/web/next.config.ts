import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@linguist/core', '@linguist/shared', '@linguist/db'],
}

export default config
