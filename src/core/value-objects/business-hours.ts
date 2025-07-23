export type WeekDay =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday'

export type TimeString = `${number}:${number}` // Formato "HH:MM"

export class Day {
	private _weekDay: WeekDay
	private _openTime: TimeString
	private _closeTime: TimeString
	constructor(weekDay: WeekDay, openTime: TimeString, closeTime: TimeString) {
		this._weekDay = weekDay
		this._openTime = openTime
		this._closeTime = closeTime
	}

	get weekDay() {
		return this._weekDay
	}

	get openTime() {
		return this._openTime
	}

	get closeTime() {
		return this._closeTime
	}

	isOpenAt(date: Date): boolean {
		const time = date.toTimeString().slice(0, 5)
		return time >= this._openTime && time <= this._closeTime
	}
}

export class BusinessHours {
	private static weekDayMap: WeekDay[] = [
		'sunday', // 0
		'monday', // 1
		'tuesday', // 2
		'wednesday', // 3
		'thursday', // 4
		'friday', // 5
		'saturday', // 6
	]

	constructor(private readonly businessHours: Day[]) {
		if (businessHours.length !== 7) {
			throw new Error('BusinessHours must contain exactly 7 days')
		}
	}

	getByDay(day: WeekDay): Day {
		return this.businessHours.find(h => h.weekDay === day)!
	}

	getDays() {
		return this.businessHours
	}

	isOpenAt(date: Date): boolean {
		const weekDay = BusinessHours.weekDayMap[date.getDay()]
		const today = this.getByDay(weekDay)
		return today.isOpenAt(date)
	}
}
