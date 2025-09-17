import type { PrismaClient } from '@prisma/client'

function hash32(input: string, seed = 2166136261): number {
	let h = seed >>> 0
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

export async function withPgAdvisoryLock<T>(
	prisma: PrismaClient,
	key: string,
	fn: () => Promise<T>
): Promise<T | null> {
	const k1 = hash32(key, 2166136261) | 0
	const k2 = hash32(key, 33554467) | 0

	const locked = await prisma.$queryRawUnsafe<
		{ pg_try_advisory_lock: boolean }[]
	>(
		'SELECT pg_try_advisory_lock($1::int, $2::int) as pg_try_advisory_lock',
		k1,
		k2
	)
	if (!locked?.[0]?.pg_try_advisory_lock) return null
	try {
		return await fn()
	} finally {
		await prisma.$executeRawUnsafe(
			'SELECT pg_advisory_unlock($1::int, $2::int)',
			k1,
			k2
		)
	}
}
