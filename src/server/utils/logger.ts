/**
 * Structured Logging Utility
 * Provides contextual audit, error, and HTTP tracking logs.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(context ? { context } : {}),
    };

    if (process.env.NODE_ENV === 'test') return;

    const prefix = `[${entry.timestamp}] [${level}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, context ? JSON.stringify(context, null, 2) : '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`, context ? JSON.stringify(context) : '');
    } else if (level === 'AUDIT') {
      console.log(`\x1b[36m${prefix} [FINANCIAL/SECURITY AUDIT]\x1b[0m ${message}`, context ? JSON.stringify(context) : '');
    } else {
      console.log(`${prefix} ${message}`, context && Object.keys(context).length > 0 ? JSON.stringify(context) : '');
    }
  }

  public static debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, context);
    }
  }

  public static info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }

  public static warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }

  public static error(message: string, context?: Record<string, any>) {
    this.log('ERROR', message, context);
  }

  public static audit(message: string, context: Record<string, any>) {
    this.log('AUDIT', message, context);
  }
}
