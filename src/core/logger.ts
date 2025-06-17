import { env } from '@/env'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
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

type Loggable = string | Record<string, unknown> | Error | unknown

export class Logger {
    private readonly timezone: string = 'America/Sao_Paulo'
    private readonly logFormat = 'HH:mm:ss.SSS - YYYY-MM-DD'

    print(data: unknown) {
        console.log(data)
    }

    private getTimestamp(): string {
        return dayjs().tz(this.timezone).format(this.logFormat)
    }

    private getCallerFile(): string {
        const error = new Error()
        const stack = error.stack?.split('\n')[4]
        const match = stack?.match(/\((.*):\d+:\d+\)/)
        return match ? match[1].split('/').slice(-2).join('/') : 'unknown'
    }

    private formatMessage(level: LogLevel, message: string): string {
        const callerFile = this.getCallerFile()
        return `[${this.getTimestamp()}] ${level} [${callerFile}] - ${message}`
    }

    private formatObject(data: unknown): string {
        if (data instanceof Error) {
            return `${data.message}\n${data.stack}`
        }
        try {
            return JSON.stringify(data, null, 2)
        } catch {
            return String(data)
        }
    }

    private shouldLog(level: LogLevel): boolean {
        if (level === LogLevel.DEBUG && env.MODE === 'production') {
            return false
        }
        return true
    }

    private log(level: LogLevel, data: Loggable, error?: Error): void {
        if (!this.shouldLog(level)) return

        const formattedMessage =
            typeof data === 'string'
                ? this.formatMessage(level, data)
                : this.formatObject(data)

        const logger = {
            [LogLevel.INFO]: console.log,
            [LogLevel.WARN]: console.warn,
            [LogLevel.ERROR]: console.error,
            [LogLevel.DEBUG]: console.debug,
        }[level]

        logger(formattedMessage)

        if (error && level !== LogLevel.ERROR) {
            console.error(
                this.formatMessage(LogLevel.ERROR, this.formatObject(error))
            )
        }
    }

    info(data: Loggable): void {
        this.log(LogLevel.INFO, data)
    }

    warn(data: Loggable): void {
        this.log(LogLevel.WARN, data)
    }

    error(data: Loggable, error?: Error): void {
        this.log(LogLevel.ERROR, data, error)
    }

    debug(data: Loggable): void {
        this.log(LogLevel.DEBUG, data)
    }
}

export const logger = new Logger()
