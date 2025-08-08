import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { getAllChats } from './get-chats'
import { getRecentChats } from './get-recent-chats'

const routes = [getAllChats, getRecentChats] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(getAllChats, { getChatsUseCase: resources.getChatsUseCase })
		app.register(getRecentChats, {
			getRecentChatsUseCase: resources.getRecentChatsUseCase,
		})
	}
)
