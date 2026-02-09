type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isProduction) {
      // In production, we want single-line JSON for easy parsing by log aggregators
      console[level](JSON.stringify(payload));
    } else {
      // In development, we want readable logs
      const colorMap = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      console[level](
        `${colorMap[level]}[${level.toUpperCase()}]${reset} ${timestamp}: ${message}`,
        context ? context : ''
      );
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
