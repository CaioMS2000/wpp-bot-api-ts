import {
	BusinessHours,
	Day,
	TimeString,
	WeekDay,
} from '@/value-objects/business-hours'
import { BusinessHoursType } from '../@types'

export function parseBusinessHours(
	businessHours: NonNullable<BusinessHoursType>
) {
	return new BusinessHours(
		businessHours.map(
			d =>
				new Day(
					d.dayOfWeek.toLowerCase() as WeekDay,
					d.open as TimeString,
					d.close as TimeString
				)
		)
	)
}
