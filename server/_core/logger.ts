type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProd = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, ctx?: Record<string, unknown>) {
    const payload = { timestamp: new Date().toISOString(), level, message, ...ctx };

    if (this.isProd) {
      console[level](JSON.stringify(payload));
    } else {
      const colors = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
      console[level](`${colors[level]}[${level.toUpperCase()}]\x1b[0m ${payload.timestamp}: ${message}`, ctx || '');
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>) { if (!this.isProd) this.log('debug', msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>) { this.log('error', msg, ctx); }
}

export const logger = new Logger();
