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
type LogMetadata = {
    pre?: Nullable<string>
    post?: Nullable<string>
}

const deafultLogMetadata: LogMetadata = {
    pre: null,
    post: null,
}
const Colors = {
    Blue: '\x1b[34m',
    BrightBlue: '\x1b[94m',
    BrightGreen: '\x1b[92m',
    BrightRed: '\x1b[91m',
    BrightYellow: '\x1b[93m',
    Cyan: '\x1b[36m',
    DarkGray: '\x1b[38;5;240m',
    DustyRed: '\x1b[38;5;167m',
    Gray: '\x1b[90m',
    Green: '\x1b[32m',
    Lavender: '\x1b[38;5;183m',
    Magenta: '\x1b[35m',
    PaleYellow: '\x1b[38;5;229m',
    Red: '\x1b[31m',
    Reset: '\x1b[0m',
    SoftBlue: '\x1b[38;5;111m',
    SoftGreen: '\x1b[38;5;108m',
    SoftOrange: '\x1b[38;5;215m',
    WarmGray: '\x1b[38;5;246m',
    White: '\x1b[37m',
    Yellow: '\x1b[33m',
}
const LevelColors = {
    [LogLevel.INFO]: Colors.Blue,
    [LogLevel.WARN]: Colors.BrightYellow,
    [LogLevel.ERROR]: Colors.BrightRed,
    [LogLevel.DEBUG]: Colors.Magenta,
}

export class Logger {
    private readonly timezone: string = 'America/Sao_Paulo'
    private readonly logFormat = 'HH:mm:ss.SSS - YYYY-MM-DD'

    print(...data: any[]) {
        const { filePath, line, column } = this.getCallerInfo()
        const fileReference = `${filePath}:${line}:${column}`
        const timestamp = this.getTimestamp()

        console.log(
            `${Colors.WarmGray}[${timestamp}] [${fileReference}]#==========${Colors.Reset}`
        )
        console.log(...data)
        console.log(`${Colors.WarmGray}==========#${Colors.Reset}\n`)
    }

    private getTimestamp(): string {
        return dayjs().tz(this.timezone).format(this.logFormat)
    }

    private getCallerInfo() {
        const error = new Error()
        const stackLines = error.stack?.split('\n') || []
        const callerLine = stackLines.find(
            line =>
                line.includes('at ') &&
                !line.includes('Logger.') &&
                !line.includes('logger.ts')
        )

        if (!callerLine) return { filePath: 'unknown', line: 0, column: 0 }

        const match = callerLine.match(/\((.*):(\d+):(\d+)\)/)

        if (!match) return { filePath: 'unknown', line: 0, column: 0 }

        return {
            filePath: match[1],
            line: Number.parseInt(match[2]),
            column: Number.parseInt(match[3]),
        }
    }

    private formatMessage(level: LogLevel, message: string): string {
        const { filePath, line, column } = this.getCallerInfo()
        const fileReference = `${filePath}:${line}:${column}`
        const levelColor = LevelColors[level]
        const timestamp = `${Colors.BrightGreen}${this.getTimestamp()}${Colors.Reset}`
        const levelText = `${levelColor}${level}${Colors.Reset}`
        const fileText = `${Colors.SoftBlue}[${fileReference}] #==========\n${Colors.Reset}`

        return `${timestamp} ${levelText} ${fileText}${message}\n${Colors.SoftBlue}==========#${Colors.Reset}`
    }

    private formatObject(data: unknown): string {
        if (data instanceof Error) {
            return `${Colors.Red}${data.message}${Colors.Reset}\n${Colors.Gray}${data.stack}${Colors.Reset}`
        }
        try {
            return `${Colors.Magenta}${JSON.stringify(data, null, 2)}${Colors.Reset}`
        } catch {
            return `${Colors.Yellow}${String(data)}${Colors.Reset}`
        }
    }

    private shouldLog(level: LogLevel): boolean {
        if (level === LogLevel.DEBUG && env.MODE === 'production') {
            return false
        }
        return true
    }

    private log(
        level: LogLevel,
        data: Loggable,
        error?: Error,
        logMetadata: LogMetadata = deafultLogMetadata
    ): void {
        if (!this.shouldLog(level)) return

        let formattedMessage =
            typeof data === 'string'
                ? this.formatMessage(level, data)
                : `${this.formatMessage(level, '')}\n${this.formatObject(data)}`

        const logger = {
            [LogLevel.INFO]: console.log,
            [LogLevel.WARN]: console.warn,
            [LogLevel.ERROR]: console.error,
            [LogLevel.DEBUG]: console.debug,
        }[level]

        if (logMetadata.pre) {
            formattedMessage = `${logMetadata.pre}${formattedMessage}`
        }
        if (logMetadata.post) {
            formattedMessage = `${formattedMessage}${logMetadata.post}`
        }

        logger(formattedMessage)

        if (error && level !== LogLevel.ERROR) {
            console.error(
                this.formatMessage(LogLevel.ERROR, this.formatObject(error))
            )
        }
    }

    info(data: Loggable, logMetadata: LogMetadata = deafultLogMetadata): void {
        this.log(LogLevel.INFO, data, undefined, logMetadata)
    }

    warn(data: Loggable, logMetadata: LogMetadata = deafultLogMetadata): void {
        this.log(LogLevel.WARN, data, undefined, logMetadata)
    }

    debug(data: Loggable, logMetadata: LogMetadata = deafultLogMetadata): void {
        this.log(LogLevel.DEBUG, data, undefined, logMetadata)
    }

    error(data: Loggable, error?: Error): void {
        this.log(LogLevel.ERROR, data, error)
    }
}

export const logger = new Logger()
