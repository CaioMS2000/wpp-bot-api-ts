import { AgentType, User, UserType, UserUnionType } from '@/@types'
import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { Employee } from '@/entities/employee'
import { Message } from '@/entities/message'
import { UnsupportedMessageTypeError } from '@/errors/errors/unsupported-message-type-error'
import { logger } from '@/logger'
import { OutputPort } from '@/output/output-port'
import { ConversationStateType } from '@/states'
import { StateParamType } from '@/states/types'
import { isClient, isEmployee } from '@/utils/entity'
import { WppIncomingContent } from '../@types/messages'
import { AgentNotCompatibleError } from '../errors/agent-no-compatible'
import { InconsistencyError } from '../errors/inconsistency'
import { InvalidMenuOptionError } from '../errors/invalid-menu-option'
import { AIService } from './ai-service'
import { ConversationService } from './conversation-service'
import { DepartmentQueueService } from './department-queue-service'
import { DepartmentService } from './department-service'
import { FAQService } from './faq-service'
import { StateContextService } from './state-context-service'
import { StateService } from './state-service'
import { UserService } from './user-service'

type ComomParams = {
	company: Company
	conversation: Conversation
	message: Message
	wppIncomingContent: WppIncomingContent
}

type HandleParams = UserUnionType & ComomParams

export class ConversationStateOrchestrator {
	private readonly MAX_HOPS = 10
	private readonly MENU_OPTIONS = [
		{ id: 'ia', title: 'Conversar com a nossa IA', restrictTo: null },
		{ id: 'faq', title: 'Ver FAQ', restrictTo: null },
		{
			id: 'departments',
			title: 'Ver departamentos',
			restrictTo: UserType.CLIENT,
		},
		{ id: 'queue', title: 'Ver fila', restrictTo: UserType.EMPLOYEE },
		{
			id: 'nextClient',
			title: 'Atender próximo',
			restrictTo: UserType.EMPLOYEE,
		},
	] as const

	constructor(
		private outputPort: OutputPort,
		private aIService: AIService,
		private stateService: StateService,
		private faqService: FAQService,
		private conversationService: ConversationService,
		private departmentService: DepartmentService,
		private departmentQueueService: DepartmentQueueService,
		private userService: UserService,
		private stateContextService: StateContextService
	) {}

	getOutputPort() {
		return this.outputPort
	}

	async handle({
		company,
		user,
		userType,
		conversation,
		message,
		wppIncomingContent,
	}: HandleParams) {
		console.log('\n\nhandling this:\n', wppIncomingContent)
		let userRef: Nullable<UserUnionType> = null
		if (!conversation.entryActionExecuted) {
			const stateParam = this.stateContextService.getContextFor(
				company,
				conversation,
				user,
				userType
			)
			const cur = await this.stateService.resolveStateData(stateParam)
			await this.execOnEnter(cur)
			conversation.markEntryActionExecuted()
			await this.conversationService.save(conversation)
		}

		if (isClient(user) && userType === UserType.CLIENT) {
			userRef = {
				user,
				userType,
			}
		} else if (isEmployee(user) && userType === UserType.EMPLOYEE) {
			userRef = {
				user,
				userType,
			}
		}

		if (!userRef) {
			throw new InconsistencyError('Could not mach user as userType')
		}

		let hops = await this.runAutoTransitions(conversation, company, userRef)

		if (hops === 0) {
			const inputParam = await this.handleOnInput(
				conversation,
				company,
				userRef,
				message,
				wppIncomingContent
			)

			if (inputParam) {
				const next = await this.stateService.resolveStateData(inputParam)

				conversation.transitionToState(next.target)
				await this.execOnEnter(next)
				conversation.markEntryActionExecuted()
				await this.conversationService.save(conversation)
				hops = await this.runAutoTransitions(conversation, company, userRef)
			}
		} else {
			logger.debug(
				"Isso aqui n fez nada depois da primeira chamada de 'runAutoTransitions'",
				wppIncomingContent
			)
		}
	}

	private async runAutoTransitions(
		conversation: Conversation,
		company: Company,
		userRef: UserUnionType
	) {
		let hops = 0

		while (hops < this.MAX_HOPS) {
			const autoParam = await this.handleAuto(conversation, company, userRef)
			if (!autoParam) break

			const next = await this.stateService.resolveStateData(autoParam)

			conversation.transitionToState(next.target)
			await this.execOnEnter(next)
			conversation.markEntryActionExecuted()
			await this.conversationService.save(conversation)

			hops++
		}

		if (hops === this.MAX_HOPS) {
			logger.error(
				{ convId: conversation.id },
				'Auto-transition hop limit reached'
			)
		}

		return hops
	}

	private async handleOnInput(
		conversation: Conversation,
		company: Company,
		userRef: UserUnionType,
		message: Message,
		wppIncomingContent: WppIncomingContent
	): Promise<Nullable<StateParamType>> {
		const { user, userType } = userRef

		switch (wppIncomingContent.kind) {
			case 'list_reply':
			case 'button_reply':
			case 'text': {
				const textContent = message.content

				if (!textContent) {
					throw new Error("'message.content' should be defined")
				}

				/* COMMOM */
				switch (conversation.state) {
					case ConversationStateType.INITIAL_MENU: {
						if (message.content === 'Ver departamentos') {
							return {
								target: ConversationStateType.SELECTING_DEPARTMENT,
								context: { clientPhone: user.phone, companyId: company.id },
							}
						}
						if (message.content === 'Conversar com a nossa IA') {
							await this.conversationService.startChatWithAI(conversation)

							return {
								target: ConversationStateType.CHATTING_WITH_AI,
								context: {
									userId: user.id,
									userType: userType,
									companyId: company.id,
								},
							}
						}
						if (message.content === 'Ver FAQ') {
							return {
								target: ConversationStateType.SELECTING_FAQ_CATEGORY,
								context: {
									userId: user.id,
									userType: userType,
									companyId: company.id,
								},
							}
						}

						if (isEmployee(user) && user.departmentId) {
							if (message.content === 'Ver fila') {
								conversation.stateMetadata = { departmentId: user.departmentId }

								return {
									target: ConversationStateType.LISTING_DEPARTMENT_QUEUE,
									context: {
										departmentId: user.departmentId,
										companyId: company.id,
									},
								}
							}

							if (message.content === 'Atender próximo') {
								const client =
									await this.conversationService.startChatWithClient(
										user,
										user.departmentId
									)

								if (!client) {
									await this.outputPort.handle(user, {
										type: 'text',
										content: '‼️ *Não foi encontrado nenhum cliente na fila*',
									})
								} else {
									return {
										target: ConversationStateType.CHATTING_WITH_CLIENT,
										context: {
											companyId: user.companyId,
											departmentId: user.departmentId,
											clientPhone: client.phone,
										},
									}
								}
							}
						}

						throw new InvalidMenuOptionError()
					}

					case ConversationStateType.SELECTING_FAQ_CATEGORY: {
						const categories = await this.faqService.getAllCategories(
							company.id
						)
						const selectedCategory = categories.find(
							c => c.name === message.content
						)

						if (selectedCategory) {
							conversation.stateMetadata = { categoryId: selectedCategory.id }

							return {
								target: ConversationStateType.LISTING_FAQ_ITEMS,
								context: {
									categoryId: selectedCategory.id,
									companyId: company.id,
									userId: user.id,
									userType: userType,
								},
							}
						}

						await this.outputPort.handle(user, {
							type: 'text',
							content:
								'‼️ *Não entendi sua escolha. Por favor, selecione uma opção válida.*',
						})

						return null
					}

					case ConversationStateType.CHATTING_WITH_AI: {
						const willFinish =
							message.content.toLowerCase().trim() === 'finalizar' &&
							userType === UserType.CLIENT

						if (willFinish) {
							await this.conversationService.finishClientChat(
								user,
								conversation.id
							)
							await this.outputPort.handle(user, {
								type: 'text',
								content: '🔔 *Seu atendimento foi finalizado*',
							})
							return null
						}

						const generatedMessage = await this.aIService.makeResponse(
							conversation,
							message,
							wppIncomingContent
						)

						await this.outputPort.handle(user, {
							type: 'text',
							content: `*Evo*\n${generatedMessage.content}`,
						})
						return null
					}
				}

				/* CLIENT ONLY */
				if (isClient(user)) {
					switch (conversation.state) {
						case ConversationStateType.SELECTING_DEPARTMENT: {
							const departments =
								await this.departmentService.findAllDepartments(company.id)

							if (!departments.length) return null

							const normalized = (s: string) =>
								s
									.normalize('NFD')
									.replace(/\p{Diacritic}/gu, '')
									.trim()
									.toLowerCase()

							const byName = departments.find(
								d => normalized(d.name) === normalized(textContent)
							)
							if (byName) {
								await this.departmentQueueService.insertClientInQueue(
									company,
									byName.id,
									user.id
								)

								conversation.stateMetadata = { departmentId: byName.id }

								return {
									target: ConversationStateType.DEPARTMENT_QUEUE,
									context: {
										clientPhone: user.phone,
										departmentId: byName.id,
										companyId: company.id,
									},
								}
							}

							await this.outputPort.handle(user, {
								type: 'text',
								content:
									'‼️ *Não entendi sua escolha. Por favor, selecione um departamento da lista.*',
							})
							await this.execOnEnter({
								target: ConversationStateType.SELECTING_DEPARTMENT,
								data: { client: user, activeDepartments: departments },
							} as any)
							return null
						}
						case ConversationStateType.DEPARTMENT_QUEUE: {
							if (message.content === 'sair!') {
								await this.departmentQueueService.removeCLientFromQueue(user.id)
							}

							await this.outputPort.handle(user, {
								type: 'text',
								content:
									'🔔 *Você está na fila para ser atendido, aguarde seu atendimento comçar.*\nSe quiser sair da fila digite *sair!*',
							})

							return null
						}
						case ConversationStateType.CHATTING_WITH_EMPLOYEE: {
							if (
								!conversation.agentId ||
								conversation.agentType !== AgentType.EMPLOYEE
							) {
								throw new AgentNotCompatibleError()
							}

							const employee = await this.userService.getEmployee(
								company.id,
								conversation.agentId,
								{ notNull: true }
							)

							await this.outputPort.handle(employee, {
								type: 'text',
								content: `🔵 *[Cliente] ${user.name}*\n📞 *${user.phone}*\n\n${message.content}`,
							})

							return null
						}
					}
				}

				/* EMPLOYEE ONLY */
				if (isEmployee(user)) {
					switch (conversation.state) {
						case ConversationStateType.CHATTING_WITH_CLIENT: {
							const department =
								await this.departmentService.getDepartmentFromEmployee(
									company.id,
									user.id
								)
							const { client, clientConversation } =
								await this.departmentService.getInChatClient(
									company.id,
									user.id
								)

							if (message.content === '!finalizar') {
								await this.conversationService.finishClientChat(
									client,
									clientConversation.id
								)
								await this.outputPort.handle(client, {
									type: 'text',
									content: '🔔 *Seu atendimento foi finalizado*',
								})
								await this.outputPort.handle(user, {
									type: 'text',
									content: '✅ *Atendimento foi finalizado*',
								})

								return {
									target: ConversationStateType.INITIAL_MENU,
									context: {
										userId: user.id,
										userType: UserType.EMPLOYEE,
										companyId: company.id,
									},
								}
							} else {
								await this.outputPort.handle(client, {
									type: 'text',
									content: `🔵 *[Funcionário] ${user.name}*\n🚩 *${department.name}*\n\n${message.content}`,
								})
							}

							return null
						}
					}
				}
				break
			}
			case 'document': {
				/* COMMOM */
				switch (conversation.state) {
					case ConversationStateType.CHATTING_WITH_AI: {
						const generatedMessage = await this.aIService.makeResponse(
							conversation,
							message,
							wppIncomingContent
						)

						await this.outputPort.handle(user, {
							type: 'text',
							content: `*Evo*\n${generatedMessage.content}`,
						})
						return null
					}
				}
				break
			}
			case 'audio': {
				/* COMMOM */
				switch (conversation.state) {
					case ConversationStateType.CHATTING_WITH_AI: {
						const generatedMessage = await this.aIService.makeResponse(
							conversation,
							message,
							wppIncomingContent
						)

						await this.outputPort.handle(user, {
							type: 'text',
							content: `*Evo*\n${generatedMessage.content}`,
						})
						return null
					}
				}
				break
			}
			default: {
				throw new UnsupportedMessageTypeError(
					`This kind(${wppIncomingContent.kind}) of message is not supported yet.`
				)
			}
		}

		return null
	}

	private async handleAuto(
		conversation: Conversation,
		company: Company,
		userRef: UserUnionType
	): Promise<Nullable<StateParamType>> {
		const { user, userType } = userRef
		switch (conversation.state) {
			case ConversationStateType.BEGIN: {
				return {
					target: ConversationStateType.INITIAL_MENU,
					context: {
						userId: user.id,
						userType: userType,
						companyId: company.id,
					},
				}
			}
			case ConversationStateType.LISTING_FAQ_ITEMS: {
				return {
					target: ConversationStateType.INITIAL_MENU,
					context: {
						userId: user.id,
						userType: userType,
						companyId: company.id,
					},
				}
			}
		}

		if (isEmployee(user)) {
			switch (conversation.state) {
				case ConversationStateType.LISTING_DEPARTMENT_QUEUE: {
					return {
						target: ConversationStateType.INITIAL_MENU,
						context: {
							userId: user.id,
							userType: userType,
							companyId: company.id,
						},
					}
				}
			}
		}

		return null
	}

	private async execOnEnter(
		stateData: Awaited<ReturnType<StateService['resolveStateData']>>
	) {
		switch (stateData.target) {
			case ConversationStateType.BEGIN: {
				const { user, company } = stateData.data
				await this.outputPort.handle(user, {
					type: 'text',
					content: `Bem vindo ao atendimento da ${company.name}.`,
				})
				return
			}
			case ConversationStateType.INITIAL_MENU: {
				const { user } = stateData.data
				const menuOptions = this.MENU_OPTIONS.filter(mo => {
					if (mo.restrictTo === null) {
						return true
					}

					if (isClient(user)) {
						return mo.restrictTo === UserType.CLIENT
					}

					if (isEmployee(user)) {
						return mo.restrictTo === UserType.EMPLOYEE
					}

					return false
				})
				await this.outputPort.handle(user, {
					type: 'list',
					text: 'Escolha uma das opções abaixo:',
					buttonText: 'Menu',
					sections: [
						{
							title: 'Menu principal',
							rows: menuOptions.map(mo => {
								// const option = Object.assign(mo, {})
								const { restrictTo, ...option } = mo

								return option
							}),
						},
					],
				})
				return
			}
			case ConversationStateType.SELECTING_DEPARTMENT: {
				const { client, activeDepartments } = stateData.data
				if (!activeDepartments.length) {
					await this.outputPort.handle(client, {
						type: 'text',
						content: 'Não há departamentos disponíveis no momento.',
					})
					return
				}
				await this.outputPort.handle(client, {
					type: 'list',
					text: 'Escolha um departamento:',
					buttonText: 'Departamentos',
					sections: [
						{
							title: 'Selecione o departamento',
							rows: activeDepartments.map(d => ({ id: d.id, title: d.name })),
						},
					],
				})
				return
			}
			case ConversationStateType.SELECTING_FAQ_CATEGORY: {
				const { user, categories } = stateData.data
				if (!categories.length) {
					await this.outputPort.handle(user, {
						type: 'text',
						content: '🔔 *Não há FAQs no sistema.*',
					})
					return
				}
				await this.outputPort.handle(user, {
					type: 'list',
					text: 'Escolha uma categoria:',
					buttonText: 'Departamentos',
					sections: [
						{
							title: 'Selecione uma categoria',
							rows: categories.map(c => ({ id: c.id, title: c.name })),
						},
					],
				})
				return
			}
			case ConversationStateType.LISTING_FAQ_ITEMS: {
				const { user, category } = stateData.data
				const items = await this.faqService.getItems(
					user.companyId,
					category.id
				)

				if (!items.length) {
					await this.outputPort.handle(user, {
						type: 'text',
						content: 'Essa categoria não tem itens cadastrados.',
					})
					return
				}
				await this.outputPort.handle(user, {
					type: 'text',
					content: `*${category.name}*\n\n${items.map(i => `*${i.question}*\n${i.answer}`).join('\n\n')}`,
				})
				return
			}
			case ConversationStateType.DEPARTMENT_QUEUE: {
				const { client, department } = stateData.data

				await this.outputPort.handle(client, {
					type: 'text',
					content: `🔔*Você está na fila de espera do departamento: ${department.name}*\nEm breve você será atendido`,
				})
				return
			}
			case ConversationStateType.LISTING_DEPARTMENT_QUEUE: {
				const { department, employee } = stateData.data
				const clientsInQueue = await this.departmentQueueService.getQueue(
					employee.companyId,
					department.id
				)

				if (clientsInQueue.length === 0) {
					await this.outputPort.handle(employee, {
						type: 'text',
						content: '❗*Sem clientes na fila de espera*',
					})
				} else {
					await this.outputPort.handle(employee, {
						type: 'text',
						content: `⬇️ *Clientes na fila:*\n${clientsInQueue.map(c => `👤*${c.name}: ${c.phone}*`)}`,
					})
				}
				return
			}
			case ConversationStateType.CHATTING_WITH_AI: {
				const { user, conversation } = stateData.data

				await this.outputPort.handle(user, {
					type: 'text',
					content: `*Evo*\nOlá, eu sou a EVO, a Inteligência Artificial da Evolight e estou aqui para te ajudar. Que tal começar enviando uma fatura de energia para análise ou perguntando sobre a Evolight? 

Para finalizar a conversa, basta enviar "Finalizar".

  -As respostas podem levar algum tempo para ser geradas.
  -Aguarde a resposta antes de enviar outra mensagem.
  -Essa funcionalidade ainda está em fase de testes, eventuais erros podem ocorrer.`,
				})
				return
			}
			case ConversationStateType.CHATTING_WITH_CLIENT: {
				const { client, employee } = stateData.data

				await this.outputPort.handle(employee, {
					type: 'text',
					content: `*Você está conversando com o cliente ${client.name}(${client.phone})*`,
				})
				return
			}
			default:
				return
		}
	}
}
