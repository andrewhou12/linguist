import type { NextConfig } from 'next'
import { join } from 'path'

const config: NextConfig = {
  transpilePackages: ['@lingle/shared', '@lingle/db'],
  outputFileTracingRoot: join(__dirname, '../../'),
  serverExternalPackages: ['kuromoji', 'ws', 'bufferutil', 'utf-8-validate'],
}

export default config
