import { env } from '@/env'
import { logger } from '@/logger'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply
): void {
	logger.error(`Error in request ${request.method} ${request.url}:\n`, error)
	if (error.statusCode === 401) {
		reply.clearCookie(env.HTTP_COOKIE_NAME, { path: '/' })
		reply.status(401).send({ message: 'Unauthorized' })
		return
	}

	reply.status(error.statusCode || 500).send({
		message: error.message ?? 'Internal server error',
	})
}
