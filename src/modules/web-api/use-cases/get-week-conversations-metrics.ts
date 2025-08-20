import { prisma } from '@/lib/prisma'
import { CloseReason, UserType } from '@/@types'
import { dayjs, TIMEZONE } from '@/config/date-and-time'

type DayMetric = {
	date: Date // meia-noite local do dia
	dayOfWeek: number // 0..6 (0=Domingo)
	label: string // "Segunda", etc. (opcional)
	total: number
	resolved: number
	pending: number // open OR abandoned
}

type WeekMetrics = {
	from: Date // domingo 00:00 local
	to: Date // hoje 23:59:59.999 local
	days: DayMetric[]
}

const WEEKDAY_LABELS = [
	'Domingo',
	'Segunda',
	'Terça',
	'Quarta',
	'Quinta',
	'Sexta',
	'Sábado',
]

function startOfWeek(d: Date) {
	// semana começando no domingo (0)
	return dayjs(d).tz(TIMEZONE).startOf('week').toDate()
}

function endOfToday(d: Date) {
	return dayjs(d).tz(TIMEZONE).endOf('day').toDate()
}

/**
 * Normaliza um Date para a meia-noite local (serve de chave do dia)
 */
function dayKey(date: Date) {
	return dayjs(date).tz(TIMEZONE).startOf('day').toDate()
}

export class GetWeekConversationsMetrics {
	async execute(
		companyId: string,
		currentDate = new Date()
	): Promise<WeekMetrics> {
		const weekStart = startOfWeek(currentDate) // domingo 00:00 local
		const todayEnd = endOfToday(currentDate) // hoje 23:59:59.999 local

		// 1) Uma única consulta para a semana corrente até "hoje"
		const rows = await prisma.conversation.findMany({
			where: {
				companyId,
				userType: UserType.CLIENT, // painel é sobre clientes
				startedAt: {
					gte: weekStart,
					lte: todayEnd, // usamos lte porque é fim do dia; alternativo seria lt de (day+1)
				},
			},
			select: {
				id: true,
				startedAt: true,
				endedAt: true,
				closeReason: true,
			},
			orderBy: { startedAt: 'asc' }, // não obrigatório, mas ajuda em debug
		})

		// 2) Pré-cria os 7 dias da semana (mas você pode limitar até hoje, se preferir)
		const baseDays: DayMetric[] = []
		for (let i = 0; i < 7; i++) {
			const d = dayjs(weekStart).add(i, 'day')
			const isAfterToday = d.isAfter(dayjs(todayEnd))
			// Se quiser **mostrar só até hoje**, pule dias futuros:
			if (isAfterToday) break

			baseDays.push({
				date: d.startOf('day').toDate(),
				dayOfWeek: d.day(), // 0..6
				label: WEEKDAY_LABELS[d.day()],
				total: 0,
				resolved: 0,
				pending: 0,
			})
		}

		// 3) Índice por dia (chave = getTime da meia-noite local)
		const index = new Map<number, DayMetric>()
		for (const dm of baseDays) index.set(dm.date.getTime(), dm)

		// 4) Agregação
		for (const c of rows) {
			const key = dayKey(c.startedAt).getTime()
			const bucket = index.get(key)
			if (!bucket) continue // fora dos dias pré-criados (defensivo)

			bucket.total += 1

			const isResolved = c.closeReason === CloseReason.RESOLVED
			const isOpen = c.endedAt == null
			const isAbandoned = c.closeReason === CloseReason.ABANDONED

			if (isResolved) bucket.resolved += 1
			if (isOpen || isAbandoned) bucket.pending += 1
		}

		return {
			from: weekStart,
			to: todayEnd,
			days: baseDays,
		}
	}
}
