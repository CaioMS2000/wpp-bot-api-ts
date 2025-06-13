import { env } from '@/env'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br' // importa o locale português do Brasil
import localizedFormat from 'dayjs/plugin/localizedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.locale('pt-br')

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

export class Logger {
    private getTimestamp(): string {
        return dayjs(new Date()).format('HH:mm:ss.SSS - YYYY-MM-DD')
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
        if (env.MODE !== 'production') {
            console.debug(this.formatMessage(LogLevel.DEBUG, message))
        }
    }
}

export const logger: Logger = new Logger()
