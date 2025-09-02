import { AgentType, UserType } from '@/@types'
import { TIMEZONE, dayjs } from '@/config/date-and-time'
// src/modules/web-api/use-cases/get-base-metrics-use-case.ts
import { prisma } from '@/lib/prisma'

type Metrics = {
	todayConversationsCount: number
	totalActiveClients: number
	responseRate: number // 0..1
	averageResponseTime: number // segundos (arredondado)
	totalAiConversations: number
}

function dayRange(d: Date) {
	const start = dayjs(d).tz(TIMEZONE).startOf('day').toDate()
	const end = dayjs(d).tz(TIMEZONE).endOf('day').toDate()
	// use [gte, lt) para evitar problemas de milissegundo
	return { start, end: dayjs(end).add(1, 'millisecond').toDate() }
}

function monthRange(d: Date) {
	const start = dayjs(d).tz(TIMEZONE).startOf('month').toDate()
	const end = dayjs(d).tz(TIMEZONE).endOf('month').toDate()
	return { start, end: dayjs(end).add(1, 'millisecond').toDate() }
}

export class GetBaseMetricsUseCase {
	async execute(companyId: string, day = new Date()): Promise<Metrics> {
		const { start: dayStart, end: dayEnd } = dayRange(day)
		const { start: monthStart, end: monthEnd } = monthRange(day)

		// 1) Conversas de CLIENTE iniciadas HOJE (timezone-aware, no banco)
		const todayConversationsCount = await prisma.conversation.count({
			where: {
				companyId,
				userType: UserType.CLIENT,
				startedAt: { gte: dayStart, lt: dayEnd },
			},
		})

		// 2) Total de clientes únicos com conversas no MÊS
		// (se preferir "total de conversas" no mês, troque por .count simples)
		const monthClientConvs = await prisma.conversation.findMany({
			where: {
				companyId,
				userType: UserType.CLIENT,
				startedAt: { gte: monthStart, lt: monthEnd },
			},
			select: {
				id: true,
				clientId: true,
				agentType: true,
				queuedAt: true,
				firstHumanResponseAt: true,
			},
		})

		const totalActiveClients = new Set(
			monthClientConvs.map(c => c.clientId).filter(Boolean)
		).size

		// 3) Conversas com IA no mês (CLIENT)
		const totalAiConversations = monthClientConvs.reduce(
			(acc, c) => (c.agentType === AgentType.AI ? acc + 1 : acc),
			0
		)

		// 4) Response rate: % das conversas de cliente que tiveram 1ª resposta humana
		// (usando o campo denormalizado firstHumanResponseAt)
		const convsWithHumanReply = monthClientConvs.filter(
			c => c.firstHumanResponseAt != null
		).length
		const totalClientConvsInMonth = monthClientConvs.length
		const responseRate = totalClientConvsInMonth
			? convsWithHumanReply / totalClientConvsInMonth
			: 0

		// 5) Average First Human Response Time (AFHRT) — média (firstHumanResponseAt - queuedAt)
		const diffsMs: number[] = []
		for (const c of monthClientConvs) {
			if (c.queuedAt && c.firstHumanResponseAt) {
				diffsMs.push(+c.firstHumanResponseAt - +c.queuedAt)
			}
		}
		const averageResponseTime = diffsMs.length
			? Math.round(diffsMs.reduce((a, b) => a + b, 0) / diffsMs.length / 1000) // segundos
			: 0

		return {
			todayConversationsCount,
			totalActiveClients,
			responseRate,
			averageResponseTime,
			totalAiConversations,
		}
	}
}
