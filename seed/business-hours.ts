import { Prisma, WeekDay } from '@prisma/client'

export async function seedBusinessHours(prisma: Prisma.TransactionClient) {
	const company = await prisma.company.findFirstOrThrow()

	const defaults = [
		{
			day: WeekDay.monday,
			openTime: '08:00',
			closeTime: '18:00',
			// isActive: true,
		},
		{
			day: WeekDay.tuesday,
			openTime: '08:00',
			closeTime: '18:00',
			// isActive: true,
		},
		{
			day: WeekDay.wednesday,
			openTime: '08:00',
			closeTime: '18:00',
			// isActive: true,
		},
		{
			day: WeekDay.thursday,
			openTime: '08:00',
			closeTime: '18:00',
			// isActive: true,
		},
		{
			day: WeekDay.friday,
			openTime: '08:00',
			closeTime: '18:00',
			// isActive: true,
		},
		{
			day: WeekDay.saturday,
			openTime: '00:00',
			closeTime: '00:00',
			// isActive: false,
		},
		{
			day: WeekDay.sunday,
			openTime: '00:00',
			closeTime: '00:00',
			// isActive: false,
		},
	]

	for (const hour of defaults) {
		await prisma.businessHour.upsert({
			where: {
				companyId_day: {
					companyId: company.id,
					day: hour.day as any,
				},
			},
			update: {},
			create: {
				...hour,
				companyId: company.id,
			},
		})
	}
}
