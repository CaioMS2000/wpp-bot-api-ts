export class StateTransition {
    constructor(
        public type: 'transition' | 'stay_current',
        public targetState: Nullable<string>,
        public message: Nullable<string>,
        public data: Nullable<any>,
        public requiresExternalData = false
    ) {}

    static toAIChat(): StateTransition {
        return new StateTransition(
            'transition',
            'ai_chat',
            'Conectando com IA...',
            null,
            false
        )
    }

    static toFAQCategories(): StateTransition {
        return new StateTransition(
            'transition',
            'faq_categories',
            'Carregando categorias...',
            null,
            true
        )
    }

    static toFAQItems(categoryName: string): StateTransition {
        return new StateTransition(
            'transition',
            'faq_items',
            null,
            categoryName,
            false
        )
    }

    static toInitialMenu(): StateTransition {
        return new StateTransition(
            'transition',
            'initial_menu',
            'Voltando ao menu principal...',
            null,
            false
        )
    }

    static toDepartmentValidation(message: string): StateTransition {
        return new StateTransition(
            'transition',
            'department_validation',
            null,
            message,
            true
        )
    }

    static toDepartmentSelection(): StateTransition {
        return new StateTransition(
            'transition',
            'department_selection',
            'Carregando departamentos...',
            null,
            true
        )
    }

    static toDepartmentChat(departmentName: string): StateTransition {
        return new StateTransition(
            'transition',
            'department_chat',
            `Conectando com ${departmentName}...`,
            departmentName,
            false
        )
    }

    static stayInCurrent(message: string): StateTransition {
        return new StateTransition('stay_current', null, message, null, false)
    }
}
