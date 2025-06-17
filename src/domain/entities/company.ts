import { Entity } from '@/core/entities/entity'
import type { Manager } from './manager'

export type WeekDay =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday'

export type TimeString = `${number}:${number}` // Formato "HH:MM"

export type BusinessHours = {
    day: WeekDay
    openTime: TimeString
    closeTime: TimeString
    isActive: boolean
}

export type CompanyProps = {
    cnpj: string
    name: string
    email: Nullable<string>
    phone: string
    website: Nullable<string>
    description: Nullable<string>
    businessHours: BusinessHours[]
    manager: Manager
}

export type CreateCompanyInput = {
    cnpj: string
    name: string
    phone: string
    manager: Manager
    email?: Nullable<string>
    website?: Nullable<string>
    description?: Nullable<string>
    businessHours?: Partial<Record<WeekDay, Omit<BusinessHours, 'day'>>>
}

export class Company extends Entity<CompanyProps> {
    private static DEFAULT_BUSINESS_HOURS: Record<
        WeekDay,
        Omit<BusinessHours, 'day'>
    > = {
        monday: { openTime: '08:00', closeTime: '18:00', isActive: true },
        tuesday: { openTime: '08:00', closeTime: '18:00', isActive: true },
        wednesday: { openTime: '08:00', closeTime: '18:00', isActive: true },
        thursday: { openTime: '08:00', closeTime: '18:00', isActive: true },
        friday: { openTime: '08:00', closeTime: '18:00', isActive: true },
        saturday: { openTime: '00:00', closeTime: '00:00', isActive: false },
        sunday: { openTime: '00:00', closeTime: '00:00', isActive: false },
    }

    static create(props: CreateCompanyInput, id?: string) {
        const businessHours = Company.createBusinessHours(props.businessHours)

        Company.validateBusinessHours(businessHours)

        const company = new Company(
            {
                email: null,
                website: null,
                description: null,
                ...props,
                businessHours,
            },
            id
        )

        return company
    }

    private static createBusinessHours(
        customHours?: Partial<Record<WeekDay, Omit<BusinessHours, 'day'>>>
    ): BusinessHours[] {
        const hours = { ...Company.DEFAULT_BUSINESS_HOURS, ...customHours }

        return (Object.keys(hours) as WeekDay[]).map(day => ({
            day,
            ...hours[day],
        }))
    }

    private static validateTimeString(time: TimeString): boolean {
        const [hoursStr, minutesStr] = time.split(':')
        const hours = Number.parseInt(hoursStr, 10)
        const minutes = Number.parseInt(minutesStr, 10)

        return (
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59 &&
            time ===
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        )
    }

    private static validateBusinessHours(hours: BusinessHours[]): void {
        const daysPresent = hours.map(h => h.day)
        const allDays: WeekDay[] = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
        ]

        if (
            new Set(daysPresent).size !== 7 ||
            !allDays.every(day => daysPresent.includes(day))
        ) {
            throw new Error(
                'Must provide business hours for all 7 days of the week'
            )
        }

        // Valida cada entrada
        hours.forEach(hour => {
            if (!Company.validateTimeString(hour.openTime)) {
                throw new Error(
                    `Invalid open time format for ${hour.day}. Use "HH:MM" format with valid time values`
                )
            }

            if (!Company.validateTimeString(hour.closeTime)) {
                throw new Error(
                    `Invalid close time format for ${hour.day}. Use "HH:MM" format with valid time values`
                )
            }

            // Verifica se closeTime é depois de openTime (quando ativo)
            if (hour.isActive) {
                const [openH, openM] = hour.openTime.split(':').map(Number)
                const [closeH, closeM] = hour.closeTime.split(':').map(Number)

                if (closeH < openH || (closeH === openH && closeM <= openM)) {
                    throw new Error(
                        `Close time must be after open time for ${hour.day}`
                    )
                }
            }
        })
    }

    get cnpj() {
        return this.props.cnpj
    }

    get name() {
        return this.props.name
    }

    get email() {
        return this.props.email
    }

    get phone() {
        return this.props.phone
    }

    get website() {
        return this.props.website
    }

    get description() {
        return this.props.description
    }

    get businessHours() {
        return this.props.businessHours
    }

    get manager() {
        return this.props.manager
    }
}
