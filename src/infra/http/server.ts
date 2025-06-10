import fs from 'node:fs'
import path from 'node:path'
import { Department } from '@/domain/entities/department'
import { WhatsAppMessageServiceFactory } from '../factory/whats-app-message-service-factory'
import { app } from './app'
import { receiveMessage } from './routes/message/receive-message'

// Função para encontrar a raiz do projeto procurando por package.json
function findProjectRoot(currentDir: string): string {
    const rootMarkers = ['package.json', '.git']
    let dir = currentDir

    while (dir !== path.parse(dir).root) {
        for (const marker of rootMarkers) {
            if (fs.existsSync(path.join(dir, marker))) {
                return dir
            }
        }
        dir = path.dirname(dir) // Move para o diretório pai
    }

    // Se não encontrou, retorna o diretório atual como fallback
    return currentDir
}

const projectRoot = findProjectRoot(__dirname)
const outputPath = path.join(projectRoot, 'response.json')

const whatsAppMessageService = WhatsAppMessageServiceFactory.create()

whatsAppMessageService.departmentRepository.save(
    Department.create({
        name: 'Departamento de TI',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.departmentRepository.save(
    Department.create({
        name: 'Departamento de Vendas',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.faqRepository.save(
    'suporte',
    'Como faço para resetar minha senha?',
    'Para resetar sua senha, acesse a página de login e clique em "Esqueci minha senha".'
)
whatsAppMessageService.faqRepository.save(
    'suporte',
    'O sistema está fora do ar, o que fazer?',
    'Primeiro verifique sua conexão com a internet. Se o problema persistir, entre em contato com o suporte técnico.'
)
whatsAppMessageService.faqRepository.save(
    'vendas',
    'Quais são as formas de pagamento aceitas?',
    'Aceitamos cartão de crédito, débito, PIX e boleto bancário.'
)
whatsAppMessageService.faqRepository.save(
    'vendas',
    'Qual o prazo de entrega dos produtos?',
    'O prazo de entrega varia de acordo com sua localização, geralmente entre 3 a 7 dias úteis.'
)

app.register(receiveMessage, { whatsAppMessageService })

async function sendMessage(message: string) {
    try {
        const response = await fetch('http://localhost:3000/message', {
            method: 'POST',
            body: JSON.stringify({
                clientPhone: '5562993765723',
                messageContent: message,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        console.log('\n\nrequest response:')
        console.log(data)

        // Escreve na raiz do projeto
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
        // console.log(`Resposta salva em ${outputPath}`)

        return data
    } catch (error) {
        console.error(error)
    }
}
async function main() {
    const serverAddress = await app.listen({ port: 3000 })

    console.clear()
    console.log(`Server running on -> ${serverAddress}`)

    await sendMessage('oi')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('3')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('suporte')

    await new Promise(resolve => setTimeout(resolve, 1000 * 2))

    await sendMessage('Menu principal')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('2')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('Departamento de TI')
}

main()
