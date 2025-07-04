import { Prisma } from '../prisma/generated'

export async function seedClientsAndChats(prisma: Prisma.TransactionClient) {
    const company = await prisma.company.findFirstOrThrow()

    const client = await prisma.client.upsert({
        where: { phone: '556293765723' },
        update: {},
        create: {
            phone: '556293765723',
            name: 'Caio Marques',
            companyId: company.id,
        },
    })

    const conversation = await prisma.conversation.create({
        data: {
            clientId: client.id,
            companyId: company.id,
            userType: 'CLIENT',
            currentState: 'initial_menu',
        },
    })

    const messages = [
        { origin: 'CLIENT', text: 'EVO (beta)' },
        {
            origin: 'AI',
            text: '*EVO*\n\nOlá, eu sou a EVO, a Inteligência Artificial da Evolight e estou aqui para te ajudar. Que tal começar enviando uma fatura de energia para análise ou perguntando sobre a Evolight?\n\nPara finalizar a conversa, basta enviar "*Finalizar*".\n\n  -As respostas podem levar algum tempo para ser geradas.\n  -Aguarde a resposta antes de enviar outra mensagem.\n  -Essa funcionalidade ainda est\u00e1 em fase de testes, eventuais erros podem ocorrer.',
        },
        {
            origin: 'CLIENT',
            text: 'Olá, EVO! É um prazer conhecê-la. 😊\n\nObrigado pela apresentação e pelas informações sobre o funcionamento.\n\nGostaria de começar perguntando mais sobre a Evolight. Poderia me contar um pouco sobre o que a Evolight faz e qual o seu propósito?',
        },
        {
            origin: 'AI',
            text: '*EVO*\n\nA Evolight é um grupo que se destaca como líder em soluções energéticas inovadoras...\n\nSe você precisar de mais informações ou tiver outras dúvidas sobre energia, estou aqui para ajudar!\n\nPara continuar utilizando minhas funcionalidades, é necessário que sejam informados os seguintes dados:\n1. Nome\n2. Email\n3. Profissão',
        },
        {
            origin: 'CLIENT',
            text: 'Caio Marques\ncaioms@email.com\nProgramador',
        },
        {
            origin: 'AI',
            text: '*EVO*\n\nPara que um consumidor residencial ou uma pequena empresa se torne elegível para migrar para o mercado livre...',
        },
        {
            origin: 'CLIENT',
            text: 'Entendi, EVO. A informação sobre a demanda mínima de 500 kW para o mercado livre...',
        },
        {
            origin: 'AI',
            text: '*EVO*\n\nVocê está absolutamente correto, Caio. Clientes residenciais em baixa tensão...',
        },
        {
            origin: 'CLIENT',
            text: 'Entendido, EVO. Agradeço muito pelo esclarecimento!',
        },
        {
            origin: 'CLIENT',
            text: 'Finalizar',
        },
        {
            origin: 'AI',
            text: '*EVO*\n\nFico feliz que as informações tenham sido úteis e que suas dúvidas tenham sido esclarecidas, Caio! 😊\n\nSe precisar de mais assistência no futuro...',
        },
    ]

    // for (const msg of messages) {
    //     await prisma.message.create({
    //         data: {
    //             conversationId: conversation.id,
    //             content: msg.text,
    //             from: msg.origin === 'CLIENT' ? 'CLIENT' : 'AI',
    //             ...(msg.origin === 'CLIENT' ? { clientId: client.id } : {}),
    //         },
    //     })
    // }
}
