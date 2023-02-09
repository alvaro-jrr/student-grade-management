import type {
	Module,
	Operation,
	OperationByRole,
	OperationName,
	Role,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
	// Create each module
	for (const module of getModules()) {
		await prisma.module.create({ data: module });
	}

	// Assign an operation to each module
	for (const operation of getOperations()) {
		await prisma.operation.create({ data: operation });
	}

	// Create roles
	for (const role of getRoles()) {
		await prisma.role.create({ data: role });
	}

	// Attach operation to each role
	for (const operationByRole of getOperationsByRole()) {
		await prisma.operationByRole.create({ data: operationByRole });
	}

	await prisma.user.create({
		data: {
			email: "alvarojrr79@gmail.com",
			identityCard: "28385587",
			// Paris.2022 hashed
			password:
				"$2a$10$c3.M5h0wtX1rXwehx3TazOyUKZqV32/xYXgphuPECRi.6ZzCrbCxK",
			roleId: 4,
			firstname: "Alvaro",
			lastname: "Resplandor",
		},
	});
}

seed()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});

function getModules(): Omit<Module, "id">[] {
	const modules = [
		"Estudiantes",
		"Inscripciones",
		"Docentes",
		"Periodos Académicos",
		"Secciones",
		"Cargas Académicas",
		"Asignaturas",
		"Represenantes",
		"Notas",
		"Evaluaciones",
		"Contraseña",
		"Coordinadores",
	];

	return modules.map((module) => ({ name: module }));
}

function getOperations(): Omit<Operation, "id">[] {
	const operations: [number, OperationName][] = [
		// Estudiante
		[1, "CREATE"],
		[1, "UPDATE"],
		[1, "READ"],

		// Inscripcion
		[2, "CREATE"],

		// Docente
		[3, "CREATE"],
		[3, "UPDATE"],
		[3, "READ"],

		// Periodo A.
		[4, "CREATE"],
		[4, "UPDATE"],
		[4, "READ"],

		// Seccion
		[5, "CREATE"],
		[5, "UPDATE"],
		[5, "READ"],

		// Carga A.
		[6, "CREATE"],
		[6, "UPDATE"],
		[6, "READ"],

		// Asignatura
		[7, "CREATE"],
		[7, "UPDATE"],
		[7, "READ"],

		// Representante
		[8, "CREATE"],
		[8, "UPDATE"],
		[8, "READ"],
		[8, "DELETE"],

		// Nota
		[9, "CREATE"],
		[9, "UPDATE"],
		[9, "READ"],

		// Evaluacion
		[10, "CREATE"],
		[10, "UPDATE"],
		[10, "READ"],

		// Contraseña
		[11, "UPDATE"],

		// Coordinador
		[12, "CREATE"],
		[12, "UPDATE"],
		[12, "READ"],
	];

	return operations.map(([moduleId, name]) => ({ moduleId, name }));
}

function getRoles(): Omit<Role, "id">[] {
	const roleNames: Role["name"][] = [
		"COORDINATOR",
		"REPRESENTATIVE",
		"TEACHER",
		"ADMIN",
	];

	return roleNames.map((roleName) => ({ name: roleName }));
}

function getOperationsByRole(): Omit<OperationByRole, "id">[] {
	return [
		{
			operationId: 1,
			roleId: 1,
		},
		{
			operationId: 2,
			roleId: 1,
		},
		{
			operationId: 3,
			roleId: 1,
		},
		{
			operationId: 4,
			roleId: 1,
		},
		{
			operationId: 5,
			roleId: 1,
		},
		{
			operationId: 6,
			roleId: 1,
		},
		{
			operationId: 7,
			roleId: 1,
		},
		{
			operationId: 8,
			roleId: 1,
		},
		{
			operationId: 9,
			roleId: 1,
		},
		{
			operationId: 10,
			roleId: 1,
		},
		{
			operationId: 11,
			roleId: 1,
		},
		{
			operationId: 12,
			roleId: 1,
		},
		{
			operationId: 13,
			roleId: 1,
		},
		{
			operationId: 14,
			roleId: 1,
		},
		{
			operationId: 15,
			roleId: 1,
		},
		{
			operationId: 16,
			roleId: 1,
		},
		{
			operationId: 17,
			roleId: 1,
		},
		{
			operationId: 18,
			roleId: 1,
		},
		{
			operationId: 19,
			roleId: 1,
		},
		{
			operationId: 20,
			roleId: 1,
		},
		{
			operationId: 21,
			roleId: 1,
		},
		{
			operationId: 22,
			roleId: 1,
		},
		{
			operationId: 23,
			roleId: 1,
		},
		{
			operationId: 25,
			roleId: 1,
		},
		{
			operationId: 26,
			roleId: 1,
		},
		{
			operationId: 28,
			roleId: 1,
		},
		{
			operationId: 29,
			roleId: 1,
		},
		{
			operationId: 30,
			roleId: 1,
		},
		{
			operationId: 26,
			roleId: 2,
		},
		{
			operationId: 24,
			roleId: 3,
		},
		{
			operationId: 26,
			roleId: 3,
		},
		{
			operationId: 27,
			roleId: 3,
		},
		{
			operationId: 29,
			roleId: 3,
		},
		{
			operationId: 30,
			roleId: 3,
		},
		{
			operationId: 1,
			roleId: 4,
		},
		{
			operationId: 2,
			roleId: 4,
		},
		{
			operationId: 3,
			roleId: 4,
		},
		{
			operationId: 4,
			roleId: 4,
		},
		{
			operationId: 5,
			roleId: 4,
		},
		{
			operationId: 6,
			roleId: 4,
		},
		{
			operationId: 7,
			roleId: 4,
		},
		{
			operationId: 8,
			roleId: 4,
		},
		{
			operationId: 9,
			roleId: 4,
		},
		{
			operationId: 10,
			roleId: 4,
		},
		{
			operationId: 11,
			roleId: 4,
		},
		{
			operationId: 12,
			roleId: 4,
		},
		{
			operationId: 13,
			roleId: 4,
		},
		{
			operationId: 14,
			roleId: 4,
		},
		{
			operationId: 15,
			roleId: 4,
		},
		{
			operationId: 16,
			roleId: 4,
		},
		{
			operationId: 17,
			roleId: 4,
		},
		{
			operationId: 18,
			roleId: 4,
		},
		{
			operationId: 19,
			roleId: 4,
		},
		{
			operationId: 20,
			roleId: 4,
		},
		{
			operationId: 21,
			roleId: 4,
		},
		{
			operationId: 22,
			roleId: 4,
		},
		{
			operationId: 23,
			roleId: 4,
		},
		{
			operationId: 24,
			roleId: 4,
		},
		{
			operationId: 25,
			roleId: 4,
		},
		{
			operationId: 26,
			roleId: 4,
		},
		{
			operationId: 27,
			roleId: 4,
		},
		{
			operationId: 28,
			roleId: 4,
		},
		{
			operationId: 29,
			roleId: 4,
		},
		{
			operationId: 30,
			roleId: 4,
		},
		{
			operationId: 31,
			roleId: 4,
		},
		{
			operationId: 32,
			roleId: 4,
		},
		{
			operationId: 33,
			roleId: 4,
		},
	];
}
