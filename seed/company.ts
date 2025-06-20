import { Prisma } from '../prisma/generated'

export async function seedCompanyAndManager(prisma: Prisma.TransactionClient) {
    const manager = await prisma.manager.upsert({
        where: { email: 'manager@evolight.com' },
        update: {},
        create: {
            name: 'Eugenio Garcia',
            email: 'manager@evolight.com',
            phone: '5562987654321',
            password: '123456',
        },
    })

    await prisma.company.upsert({
        where: { cnpj: '99999999999999' },
        update: {},
        create: {
            name: 'Evolight',
            phone: '556236266103',
            cnpj: '99999999999999',
            email: 'contato@evolight.com.br',
            website: 'https://evolight.com.br',
            description: 'Líder em soluções de energia renovável.',
            managerId: manager.id,
        },
    })
}
