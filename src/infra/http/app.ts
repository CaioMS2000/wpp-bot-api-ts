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

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors, {
	origin: [
		'http://localhost:8082',
		'http://localhost:8080',
		'http://localhost:5173',
	],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
app.register(fastifyCookie)
app.register(fastifyJwt, {
	secret: 'some secret',
	cookie: {
		cookieName: 'token',
		signed: false,
	},
})
app.register(requestLogger)
app.setErrorHandler(errorHandler)

export { app }
