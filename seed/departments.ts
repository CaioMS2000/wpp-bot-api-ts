import { Prisma, PrismaClient } from '../prisma/generated'

export async function seedDepartments(prisma: Prisma.TransactionClient) {
    const company = await prisma.company.findFirstOrThrow()

    const departments: Prisma.DepartmentCreateManyInput[] = [
        {
            name: 'Tecnologia da Informação',
            description:
                'Departamento responsável por sistemas, infraestrutura e suporte técnico',
            companyId: company.id,
        },
        {
            name: 'Atendimento',
            description:
                'Departamento responsável pelo atendimento aos clientes',
            companyId: company.id,
        },
        {
            name: 'Financeiro',
            description:
                'Departamento responsável pela gestão financeira da empresa',
            companyId: company.id,
        },
        {
            name: 'Comercial',
            description:
                'Departamento responsável pelas vendas e relacionamento com o cliente',
            companyId: company.id,
        },
        {
            name: 'Marketing',
            description: 'Departamento de divulgação e estratégias de mercado',
            companyId: company.id,
        },
        {
            name: 'RH',
            description: 'Departamento de Recursos Humanos',
            companyId: company.id,
        },
        {
            name: 'Engenharia',
            description:
                'Departamento técnico e projetos de engenharia da empresa',
            companyId: company.id,
        },
    ]

    await prisma.department.createMany({
        data: departments,
        skipDuplicates: true,
    })
}
