export type Tenant = {
	id: string
	name: string
	cnpj: string
	phone: string
	site?: string | null
	email?: string | null
	description?: string | null
	businessHours?: BusinessHours | null
	aiTokenApi?: string | null
	metaTokenApi?: string | null
	createdAt: Date
	updatedAt: Date
}

export type DayHours = {
	open: number
	close: number
}

export type BusinessHours = {
	mon: DayHours
	tue: DayHours
	wed: DayHours
	thu: DayHours
	fri: DayHours
	sat: DayHours
	sun: DayHours
}
