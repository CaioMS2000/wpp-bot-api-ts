import { StateParamType } from '@/states/types'

export type MenuOption = {
	key: string
	label: string
	forClient: boolean
	forEmployee: boolean
}

export type MaybeATransitionType = Voidable<NotDefined<StateParamType>>
