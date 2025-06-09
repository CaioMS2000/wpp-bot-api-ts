import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
    ZodTypeProvider,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors)

export { app }
