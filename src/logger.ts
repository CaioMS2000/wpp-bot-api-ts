import util from 'node:util'
import { env } from '@/config/env'
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

export const ConsoleFontColors = {
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
	[LogLevel.INFO]: ConsoleFontColors.Blue,
	[LogLevel.WARN]: ConsoleFontColors.BrightYellow,
	[LogLevel.ERROR]: ConsoleFontColors.BrightRed,
	[LogLevel.DEBUG]: ConsoleFontColors.Magenta,
}

export class Logger {
	private readonly timezone = 'America/Sao_Paulo'
	private readonly logFormat = 'HH:mm:ss.SSS - YYYY-MM-DD'

	info(...data: any[]) {
		this.log(LogLevel.INFO, ...data)
	}

	warn(...data: any[]) {
		this.log(LogLevel.WARN, ...data)
	}

	debug(...data: any[]) {
		this.log(LogLevel.DEBUG, ...data)
	}

	error(...data: any[]) {
		this.log(LogLevel.ERROR, ...data)
	}

	private shouldLog(level: LogLevel): boolean {
		return !(level === LogLevel.DEBUG && env.NODE_ENV === 'production')
	}

	private getTimestamp(): string {
		return dayjs().tz(this.timezone).format(this.logFormat)
	}

	private getCallerInfo() {
		const stack = new Error().stack?.split('\n') || []
		const line = stack.find(
			l =>
				l.includes('at ') && !l.includes('Logger.') && !l.includes('logger.ts')
		)
		const match = line?.match(/\((.*):(\d+):(\d+)\)/)

		if (!match) return { filePath: 'unknown', line: 0, column: 0 }

		return {
			filePath: match[1],
			line: Number.parseInt(match[2]),
			column: Number.parseInt(match[3]),
		}
	}

	private formatObject(data: any): string {
		if (data instanceof Error) {
			return `${ConsoleFontColors.Red}${data.message}${ConsoleFontColors.Reset}\n${ConsoleFontColors.Gray}${data.stack}${ConsoleFontColors.Reset}`
		}
		return `${ConsoleFontColors.Magenta}${util.inspect(data, {
			depth: null,
			colors: true,
			maxArrayLength: null,
		})}${ConsoleFontColors.Reset}`
	}

	private log(level: LogLevel, ...data: any[]) {
		if (!this.shouldLog(level)) return

		const logger = {
			[LogLevel.INFO]: console.log,
			[LogLevel.WARN]: console.warn,
			[LogLevel.ERROR]: console.error,
			[LogLevel.DEBUG]: console.debug,
		}[level]

		const { filePath, line, column } = this.getCallerInfo()
		const fileRef = `${filePath}:${line}:${column}`
		const timestamp = `${ConsoleFontColors.BrightGreen}${this.getTimestamp()}${ConsoleFontColors.Reset}`
		const levelText = `${LevelColors[level]}${level}${ConsoleFontColors.Reset}`

		logger(
			`${ConsoleFontColors.WarmGray}[${timestamp}] ${levelText} ${ConsoleFontColors.SoftBlue}[${fileRef}]#==========${ConsoleFontColors.Reset}`
		)

		for (const item of data) {
			if (typeof item === 'string') {
				logger(item)
			} else {
				logger(this.formatObject(item))
			}
		}

		logger(
			`${ConsoleFontColors.SoftBlue}==========#${ConsoleFontColors.Reset}\n`
		)
	}
}

export const logger = new Logger()
