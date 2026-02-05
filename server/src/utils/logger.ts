export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').split('.')[0];
  }

  static log(level: LogLevel, message: string, data?: any): void {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, data || '');
        break;
    }
  }

  static info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  static debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  static warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  static error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
