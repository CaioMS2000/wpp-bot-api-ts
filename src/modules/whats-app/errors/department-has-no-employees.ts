export class DepartmentHasNoEmployeesError extends Error {
	constructor(message = 'Department has no employees') {
		super(message)
	}
}
