import { Conversation } from '@/domain/entities/conversation'
import { StateTransition } from '../states/state-transition'
import {
    DepartmentValidation,
    MenuOption,
    MessageProcessingResult,
    WhatsAppResponse,
} from '../../@types'
import { Department } from '@/domain/entities/department'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { DepartmentSelectionState } from '../states/department-selection-state'
import { ConversationRepository } from '@/domain/repositories/conversation-repositorie'
import { DepartmentRepository } from '@/domain/repositories/department-repositorie'
import { FAQRepository } from '@/domain/repositories/faq-repositorie'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { Message } from '@/domain/entities/message'
import { Client } from '@/domain/entities/client'
import { DepartmentChatState } from '../states/department-chat-state'
import { AIChatState } from '../states/ai-chat-state'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class WhatsAppMessageService {
    constructor(
        private conversationRepo: ConversationRepository,
        private departmentRepo: DepartmentRepository,
        private faqRepo: FAQRepository,
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
    ): Promise<void> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from,
            content,
        })

        await this.messageRepo.save(message)
    }

    private async handleExternalDataRequirement(
        conversation: Conversation,
        transition: StateTransition
    ): Promise<void> {
        // Using 2 'switch' statements to satisfy TypeScript and BiomeJS, and still not cause runtime errors
        switch (transition.targetState) {
            case 'faq_categories':
                const faqData = await this.faqRepo.findFirst() // Assume que existe um FAQ principal
                if (faqData) {
                    const faqCatState = new FAQCategoriesState(
                        conversation,
                        faqData
                    )
                    conversation.transitionToState(faqCatState)
                } else {
                    // Fallback se não encontrar FAQ
                    const initialState = new InitialMenuState(conversation)
                    conversation.transitionToState(initialState)
                }
                break

            case 'faq_items':
                // FAQ items não precisa buscar dados externos, usa os dados já carregados
                const currentFaqData = await this.faqRepo.findFirst()
                if (currentFaqData) {
                    const categoryName = transition.data as string
                    const faqItemsState = new FAQItemsState(
                        conversation,
                        categoryName,
                        currentFaqData
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
