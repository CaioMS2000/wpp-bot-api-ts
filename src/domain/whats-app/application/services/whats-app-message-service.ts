import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import {
    DepartmentValidation,
    MenuOption,
    MessageProcessingResult,
    WhatsAppResponse,
} from '../../@types'
import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/department-chat-state'
import { DepartmentSelectionState } from '../states/department-selection-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateTransition } from '../states/state-transition'

export class WhatsAppMessageService {
    constructor(
        private conversationRepo: ConversationRepository,
        public departmentRepo: DepartmentRepository,
        public faqRepo: FAQRepository,
        private messageRepo: MessageRepository,
        private clientRepo: ClientRepository
    ) {}

    async processIncomingMessage(
        clientPhone: string,
        messageContent: string
    ): Promise<WhatsAppResponse> {
        // 1. Busca ou cria conversa
        let conversation =
            await this.conversationRepo.findActiveByClientPhone(clientPhone)

        if (!conversation) {
            const client = await this.getOrCreateClient(clientPhone)
            conversation = Conversation.create({
                client,
                agent: 'AI',
                participants: [client],
                messages: [],
            })
            await this.conversationRepo.save(conversation)
        }

        // 2. Processa mensagem na entidade
        const result = conversation.processMessage(messageContent)

        // 3. Se precisa de dados externos, busca e recria o estado
        if (result.requiresExternalData) {
            await this.handleExternalDataRequirement(
                conversation,
                result.transition
            )
        }

        // 4. Salva mensagem e conversa
        await this.saveMessage(conversation, messageContent, 'client')
        await this.conversationRepo.save(conversation)

        // 5. Prepara resposta
        return this.buildWhatsAppResponse(conversation, result)
    }

    private async getOrCreateClient(phone: string): Promise<Client> {
        // Tenta buscar cliente existente
        let client = await this.clientRepo.findByPhone(phone)

        if (!client) {
            // Cria novo cliente
            client = Client.create({
                phone,
                state: 'initial_menu',
                department: '',
                event_history: [],
            })
            await this.clientRepo.save(client)
        }

        return client
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        from: 'client' | 'employee' | 'AI'
    ): Promise<Message> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from,
            content,
        })

        await this.messageRepo.save(message)

        return message
    }

    private async handleExternalDataRequirement(
        conversation: Conversation,
        transition: StateTransition
    ): Promise<void> {
        // Using 2 'switch' statements to satisfy TypeScript and BiomeJS, and still not cause runtime errors
        switch (transition.targetState) {
            case 'faq_categories':
                const categories = await this.faqRepo.findCategories()
                if (categories.length > 0) {
                    const faqCatState = new FAQCategoriesState(
                        conversation,
                        categories
                    )
                    conversation.transitionToState(faqCatState)
                } else {
                    const initialState = new InitialMenuState(conversation)
                    conversation.transitionToState(initialState)
                }
                break

            case 'faq_items':
                const categoryName = transition.data as string
                const items =
                    await this.faqRepo.findItemsByCategory(categoryName)
                if (items.length > 0) {
                    const faqItemsState = new FAQItemsState(
                        conversation,
                        categoryName,
                        items
                    )
                    conversation.transitionToState(faqItemsState)
                }
                break

            case 'initial_menu':
                const initialState = new InitialMenuState(conversation)
                conversation.transitionToState(initialState)
                break
        }

        const allDepartments = await this.departmentRepo.findAllActive()

        switch (transition.targetState) {
            case 'department_selection':
                const departmentState = new DepartmentSelectionState(
                    conversation,
                    allDepartments
                )
                conversation.transitionToState(departmentState)
                break

            case 'department_validation':
                // Primeiro busca os departamentos
                const isValidDept = this.validateDepartmentSelection(
                    transition.data as string,
                    allDepartments
                )

                if (isValidDept.valid) {
                    // Vai direto para o chat do departamento
                    const deptChatState = new DepartmentChatState(
                        conversation,
                        isValidDept.department!
                    )
                    conversation.transitionToState(deptChatState)
                } else {
                    // Vai para seleção de departamentos
                    const departmentState = new DepartmentSelectionState(
                        conversation,
                        allDepartments
                    )
                    conversation.transitionToState(departmentState)
                }
                break

            case 'ai_chat':
                const aiChatState = new AIChatState(
                    conversation,
                    allDepartments
                )
                conversation.transitionToState(aiChatState)
                break
        }
    }

    private validateDepartmentSelection(
        message: string,
        departments: Department[]
    ): DepartmentValidation {
        // Tenta por número
        const numberMatch = message.match(/^\d+$/)
        if (numberMatch) {
            const index = Number.parseInt(numberMatch[0]) - 1
            const dept = departments[index]
            return { valid: !!dept, department: dept }
        }

        // Tenta por nome
        const dept = departments.find(d =>
            d.name.toLowerCase().includes(message.toLowerCase())
        )

        return { valid: !!dept, department: dept }
    }

    private buildWhatsAppResponse(
        conversation: Conversation,
        result: MessageProcessingResult
    ): WhatsAppResponse {
        let responseText = result.responseData.message

        // Para FAQ items, inclui o conteúdo das perguntas e respostas
        if (conversation.currentStateName === 'faq_items') {
            const faqState = conversation.currentState as FAQItemsState
            responseText = faqState.getFAQContent()
        }

        const options = conversation.getCurrentMenuOptions()
        if (options.length > 0) {
            responseText += `\n\n${this.formatMenuOptions(options)}`
        }

        return {
            to: conversation.client.phone,
            message: responseText,
            conversation_id: conversation.id,
        }
    }

    private formatMenuOptions(options: MenuOption[]): string {
        return options.map(opt => `${opt.key} - ${opt.label}`).join('\n')
    }
}
