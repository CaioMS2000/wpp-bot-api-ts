import { Department } from '@/entities/department'
import { Department as PrismaDepartment } from 'ROOT/prisma/generated'

export class DepartmentMapper {
	static toEntity(raw: PrismaDepartment): Department {
		return Department.create(
			{
				name: raw.name,
				description: raw.description ?? undefined,
				companyId: raw.companyId,
			},
			raw.id
		)
	}

	static toModel(entity: Department): Omit<PrismaDepartment, 'id'> {
		return {
			name: entity.name,
			description: entity.description,
			companyId: entity.companyId,
		}
	}
}
