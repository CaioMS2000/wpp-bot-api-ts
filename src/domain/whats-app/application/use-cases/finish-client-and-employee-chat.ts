import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Employee } from '@/domain/entities/employee'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { InitialMenuState } from '../states/initial-menu-state'
import { Conversation } from '@/domain/entities/conversation'
import { logger } from '@/core/logger'
import type { StateFactory } from '../factory/state-factory'

export class FinishClientAndEmployeeChatUseCase {
    constructor(
        private conversationRepository: ConversationRepository,
        private stateFactory: StateFactory
    ) {}

    async execute(company: Company, client: Client, employee: Employee) {
        logger.debug(
            'FinishClientAndEmployeeChatUseCase\nclient\n',
            client,
            '\nemployee\n',
            employee
        )
        let clientConversation =
            await this.conversationRepository.findActiveByClientPhoneOrThrow(
                company,
                client.phone
            )
        const employeeConversation =
            await this.conversationRepository.findActiveByEmployeePhoneOrThrow(
                company,
                employee.phone
            )

        clientConversation.endedAt = new Date()

        await this.conversationRepository.save(clientConversation)
        await clientConversation.currentState.onExit()

        clientConversation = Conversation.create({ user: client, company })

        clientConversation.transitionToState(
            this.stateFactory.create(clientConversation, {
                stateName: 'InitialMenuState',
            })
        )
        await this.conversationRepository.save(clientConversation)
        employeeConversation.transitionToState(
            this.stateFactory.create(employeeConversation, {
                stateName: 'InitialMenuState',
            })
        )
        await this.conversationRepository.save(employeeConversation)
    }
}
