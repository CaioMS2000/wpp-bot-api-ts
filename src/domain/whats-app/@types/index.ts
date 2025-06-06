import { Department } from '@/domain/entities/department'
import { StateTransition } from '../application/states/state-transition'

export interface MenuOption {
    key: string
    label: string
}

export interface StateInfo {
    name: string
    requiresExternalData: boolean
    nextPossibleStates: string[]
}

export interface MessageProcessingResult {
    transition: StateTransition
    currentStateInfo: StateInfo
    requiresExternalData: boolean
    responseData: ResponseData
}

export interface ResponseData {
    message: string
    options?: MenuOption[]
    requiresDataFetch?: boolean
}

export interface WhatsAppResponse {
    to: string
    message: string
    conversation_id: string
}

export interface DepartmentValidation {
    valid: boolean
    department?: Department
}
