export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

export class Logger {
    private getTimestamp(): string {
        return new Date().toISOString()
    }

    private formatMessage(level: LogLevel, message: string): string {
        return `[${this.getTimestamp()}] ${level} - ${message}`
    }

    info(message: string): void {
        console.log(this.formatMessage(LogLevel.INFO, message))
    }

    warn(message: string): void {
        console.warn(this.formatMessage(LogLevel.WARN, message))
    }

    error(message: string, error?: Error): void {
        console.error(this.formatMessage(LogLevel.ERROR, message))
        if (error) {
            console.error(error.stack)
        }
    }

    debug(message: string): void {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.formatMessage(LogLevel.DEBUG, message))
        }
    }
}
