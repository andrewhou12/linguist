import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@lingle/core', '@lingle/shared', '@lingle/db'],
}

export default config
