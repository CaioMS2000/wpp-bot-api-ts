import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { CreateManagerInput, Manager } from '@/entities/manager'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { ManagerMapper } from '@/infra/database/mappers/manager-mapper'
import { prisma } from '@/lib/prisma'
import { omitUndefined } from '@/utils/no-undefined'

type UpdateManagerProps = {
	name?: string
	email?: string
	phone?: Nullable<string>
}

export class ManagerService {
	async create(props: CreateManagerInput) {
		const newManager = Manager.create(props)

		await prisma.manager.create({
			data: {
				id: newManager.id,
				name: newManager.name,
				companyId: newManager.companyId,
				email: newManager.email,
				password: newManager.password,
				phone: newManager.phone,
			},
		})
	}

	async save(manager: Manager) {
		await prisma.manager.update({
			where: { id: manager.id },
			data: {
				name: manager.name,
				companyId: manager.companyId,
				email: manager.email,
				phone: manager.phone,
			},
		})
	}

	async getManager(id: string): Promise<Nullable<Manager>>
	async getManager(id: string, config: NotNullConfig): Promise<Manager>
	async getManager(id: string, config?: NotNullParams) {
		const model = await prisma.manager.findUnique({ where: { id } })

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Manager not found')
			}

			return null
		}

		return ManagerMapper.toEntity(model)
	}

	async getByEmail(email: string): Promise<Nullable<Manager>>
	async getByEmail(email: string, config: NotNullConfig): Promise<Manager>
	async getByEmail(email: string, config?: NotNullParams) {
		const model = await prisma.manager.findUnique({ where: { email } })

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Manager not found')
			}

			return null
		}

		return ManagerMapper.toEntity(model)
	}

	async update(email: string, data: UpdateManagerProps) {
		const manager = await this.getByEmail(email, { notNull: true })

		return await prisma.manager.update({
			where: { id: manager.id },
			data: omitUndefined(data),
		})
	}
}
