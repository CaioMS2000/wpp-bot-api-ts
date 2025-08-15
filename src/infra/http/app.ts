import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { fastify } from 'fastify'
import {
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { errorHandler } from './routes/api/middlewares/error-handler'
import { requestLogger } from './routes/api/middlewares/plugins/request-logger'
import { parseOrigins } from '@/utils/cors'
import { env } from '@/env'
import { logger } from '@/logger'

const app = fastify({ trustProxy: true })
const allowedOrigins = parseOrigins(env.CORS_ORIGINS)

logger.info('allowedOrigins:', allowedOrigins)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors, {
	origin: allowedOrigins,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
app.register(fastifyCookie)
app.register(fastifyJwt, {
	secret: env.HTTP_TOKEN_SECRET,
	cookie: {
		cookieName: env.HTTP_COOKIE_NAME,
		signed: false,
	},
})
app.register(requestLogger)
app.setErrorHandler(errorHandler)

export { app }
