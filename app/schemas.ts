import { z } from "zod";

export const userSchema = z.object({
	username: z.string().min(1, "Debe ingresar su nombre de usuario"),
	password: z.string().min(1, "Debe ingresar su contraseña"),
});

const identityCard = z
	.string()
	.min(1, "Debe ingresar su cédula de identidad")
	.regex(/^\d+$/, "Debe contener solo números");

export const registerSchema = z.object({
	identityCard,
	username: z
		.string()
		.min(1, "Debe ingresar un nombre de usuario")
		.min(5, "El nombre de usuario debe tener como mínimo 5 caracteres")
		.regex(
			/^[A-Za-z][A-Za-z0-9_]/,
			"Debe comenzar con un caracter alfabético y solo puede contener caracteres alfanúmericos y guiones bajos (_)"
		),
	password: z
		.string()
		.min(1, "Debe establecer una contraseña")
		.min(5, "La contraseña debe tener como mínimo 5 caracteres"),
});

export const personSchema = z.object({
	firstname: z
		.string()
		.min(1, "Debe ingresar su nombre")
		.max(25, "Debe ser menor o igual a 25 caracteres"),
	lastname: z
		.string()
		.min(1, "Debe ingresar su apellido")
		.max(25, "Debe ser menor o igual a 25 caracteres"),
	identityCard,
});

export const teacherSchema = personSchema.extend({
	specialty: z.string().min(1, "Debe ingresar su especialidad"),
});

const parseDate = (value: unknown) => new Date(String(value));

export const studentSchema = personSchema.extend({
	birthDate: z.preprocess(parseDate, z.date()),
});

export const academicPeriodSchema = z.object({
	startDate: z.preprocess(parseDate, z.date()),
	endDate: z.preprocess(parseDate, z.date()),
});

const parseNumber = (value: unknown) => (value ? Number(value) : undefined);

export const courseSchema = z.object({
	title: z.string().min(1, "Debe ingresar el titulo"),
	year: z.preprocess(
		parseNumber,
		z.number({ required_error: "Debe seleccionar un año" })
	),
});

const academicPeriodId = z.preprocess(
	parseNumber,
	z.number({ required_error: "Debe seleccionar un periodo" })
);

const courseId = z.preprocess(
	parseNumber,
	z.number({ required_error: "Debe seleccionar una asignatura" })
);

export const academicLoadSchema = z.object({
	academicPeriodId,
	courseId,
	teacherIdentityCard: z.string().min(1, "Debe seleccionar un docente"),
});

export const representativeSchema = personSchema.extend({
	email: z
		.string()
		.min(1, "Debe ingresar su email")
		.email({ message: "Debe ingresar un email valido" }),
	phoneNumber: z.string().min(1, "Debe ingresar su telefono"),
});

export const representationSchema = z.object({
	representativeIdentityCard: identityCard,
	studentIdentityCard: identityCard,
});

export const assignmentSchema = z.object({
	courseId,
	lapseId: z.preprocess(
		parseNumber,
		z.number({ required_error: "Debe seleccionar un lapso" })
	),
	description: z.string().min(1, "Debe ingresar una descripción"),
	weight: z.preprocess(
		parseNumber,
		z
			.number({ required_error: "Debe ingresar un peso" })
			.int("Debe ser un número entero")
			.min(1, "Debe ser mayor o igual a 0")
			.max(100, "Debe ser menor o igual a 100")
	),
});

export const sectionSchema = z.object({
	academicPeriodId,
	studyYearId: z.preprocess(
		parseNumber,
		z.number({ required_error: "Debe seleccionar un año" })
	),
	description: z
		.string()
		.regex(/[a-zA-Z]/, "Debe ser una letra (A-Z)")
		.min(1, "Debe ingresar una letra")
		.max(1, "Debe ser una sola letra"),
});

export const enrollmentSchema = z.object({
	studyYearId: z.preprocess(
		parseNumber,
		z.number({ required_error: "Debe seleccionar un año" })
	),
	studentIdentityCard: identityCard,
});
