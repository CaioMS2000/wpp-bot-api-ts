export type TransitionType = 'transition' | 'stay_current'
export type StateTransitionProps = {
    targetState?: Nullable<string>
    message?: Nullable<string>
    data?: Nullable<any>
    requiresExternalData?: Nullable<boolean>
}

const defaultStateTransitionProps: StateTransitionProps = {
    targetState: null,
    message: null,
    data: null,
    requiresExternalData: false,
}

export class StateTransition {
    constructor(
        public type: TransitionType,
        public stateTransitionProps: Partial<StateTransitionProps> = defaultStateTransitionProps
    ) {
        this.stateTransitionProps = {
            ...defaultStateTransitionProps,
            ...stateTransitionProps,
        }
    }

    get targetState() {
        return this.stateTransitionProps.targetState
    }

    get message() {
        return this.stateTransitionProps.message
    }

    get data() {
        return this.stateTransitionProps.data
    }

    get requiresExternalData() {
        return this.stateTransitionProps.requiresExternalData
    }

    static toAIChat(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'ai_chat',
            message: 'Conectando com IA...',
        })
    }

    static toFAQCategories(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'faq_categories',
            message: 'Carregando categorias...',
            requiresExternalData: true,
        })
    }

    static toFAQItems(categoryName: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'faq_items',
            data: categoryName,
        })
    }

    static toInitialMenu(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'initial_menu',
            message: 'Voltando ao menu principal...',
        })
    }

    static toDepartmentValidation(message: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_validation',
            message,
            requiresExternalData: true,
        })
    }

    static toDepartmentSelection(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_selection',
            message: 'Carregando departamentos...',
            requiresExternalData: true,
        })
    }

    static toDepartmentQueue(departmentName: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_queue',
            message: `['message' param]Você está na fila de espera de ${departmentName}, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
            data: departmentName,
        })
    }

    static toDepartmentChat(departmentName: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_chat',
            message: `Conectando com ${departmentName}...`,
            data: departmentName,
        })
    }

    static stayInCurrent(message: Nullable<string> = null): StateTransition {
        return new StateTransition('stay_current', { message })
    }
}
