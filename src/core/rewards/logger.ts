/**
 * Logging utility for RuleRepository operations
 * Provides structured logging for debugging and monitoring
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  operation: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  log(
    level: LogLevel,
    operation: string,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      operation,
      message,
      data,
      error,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with appropriate formatting
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${operation}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data || "");
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data || "");
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data || "");
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data || "", error || "");
        break;
    }
  }

  debug(operation: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, operation, message, data);
  }

  info(operation: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, operation, message, data);
  }

  warn(operation: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, operation, message, data);
  }

  error(
    operation: string,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    this.log(LogLevel.ERROR, operation, message, data, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const logger = new Logger();
