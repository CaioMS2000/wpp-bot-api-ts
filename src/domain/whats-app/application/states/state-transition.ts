import { StateName } from '../factory/state-factory'

export type TransitionType = 'transition' | 'stay_current'
export type StateTransitionProps = {
    targetState: Nullable<StateName>
    data: Nullable<any>
    requiresExternalData: Nullable<boolean>
}

const defaultStateTransitionProps: StateTransitionProps = {
    targetState: null,
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

    get data() {
        return this.stateTransitionProps.data
    }

    get requiresExternalData() {
        return this.stateTransitionProps.requiresExternalData
    }

    static stayInCurrent(message: Nullable<string> = null): StateTransition {
        return new StateTransition('stay_current')
    }

    static toAIChat(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'ai_chat',
        })
    }

    static toFAQCategories(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'faq_categories',
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
        })
    }

    static toDepartmentSelection(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_selection',
            requiresExternalData: true,
        })
    }

    static toDepartmentQueue(departmentName: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_queue',
            data: departmentName,
        })
    }

    static toDepartmentChat(departmentName: string): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_chat',
            data: departmentName,
        })
    }

    static toDepartmentListQueue(): StateTransition {
        return new StateTransition('transition', {
            targetState: 'department_queue_list',
            requiresExternalData: true,
        })
    }
}
