import { env } from '@/config/env'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, toErrorEnvelope } from '@/infra/http/errors'
import { ZodError } from 'zod'

export function errorHandler(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply
): void {
	console.error(`Error in request ${request.method} ${request.url}:\n`, error)

	// AppError: envelope padronizado
	if (error instanceof AppError) {
		if (error.statusCode === 401) {
			reply.clearCookie(env.HTTP_COOKIE_NAME, { path: '/' })
		}
		reply.status(error.statusCode).send(toErrorEnvelope(error))
		return
	}

	// ZodError -> 422
	if (error instanceof ZodError) {
		const appErr = AppError.validation(error.issues)
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}

	// Mapeamento mínimo por statusCode quando não for AppError
	const sc = (error as any)?.statusCode as number | undefined
	if (sc === 401) {
		const appErr = AppError.unauthenticated('Sessão expirada ou ausente.')
		reply.clearCookie(env.HTTP_COOKIE_NAME, { path: '/' })
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}
	if (sc === 403) {
		const appErr = AppError.forbidden()
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}
	if (sc === 404) {
		const appErr = AppError.notFound()
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}
	if (sc === 409) {
		const appErr = AppError.conflict()
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}
	if (sc === 422) {
		const appErr = AppError.validation()
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}
	if (sc === 429) {
		const appErr = AppError.rateLimited()
		reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
		return
	}

	// Fallback 500
	const appErr = AppError.internal()
	reply.status(appErr.statusCode).send(toErrorEnvelope(appErr))
}
