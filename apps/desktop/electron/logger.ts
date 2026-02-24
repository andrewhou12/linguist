type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

function formatData(data?: Record<string, unknown>): string {
  if (!data) return ''
  try {
    const compact = JSON.stringify(data)
    if (compact.length <= 200) return ` ${compact}`
    return ` ${JSON.stringify(data, null, 2)}`
  } catch {
    return ` [unserializable data]`
  }
}

function formatLine(level: LogLevel, namespace: string, message: string, data?: Record<string, unknown>): string {
  const ts = new Date().toISOString()
  return `[${ts}] [${LEVEL_LABELS[level]}] [${namespace}] ${message}${formatData(data)}`
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  timer(): () => number
}

export function createLogger(namespace: string): Logger {
  return {
    debug(message: string, data?: Record<string, unknown>): void {
      console.debug(formatLine('debug', namespace, message, data))
    },
    info(message: string, data?: Record<string, unknown>): void {
      console.info(formatLine('info', namespace, message, data))
    },
    warn(message: string, data?: Record<string, unknown>): void {
      console.warn(formatLine('warn', namespace, message, data))
    },
    error(message: string, data?: Record<string, unknown>): void {
      console.error(formatLine('error', namespace, message, data))
    },
    timer(): () => number {
      const start = performance.now()
      return () => Math.round(performance.now() - start)
    },
  }
}
