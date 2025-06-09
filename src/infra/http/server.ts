import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
    ZodTypeProvider,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { receiveMessage } from './routes/message/receive-message'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors)
app.register(receiveMessage)

app.listen({ port: 3000 }).then((...args) => {
    console.log(`Server running on -> ${args}`)
})
