import { z } from "zod";

export const userSchema = z.object({
	username: z.string().min(1, "Debe ingresar su nombre de usuario"),
	password: z.string().min(1, "Debe ingresar su contraseña"),
});

export const registerSchema = z.object({
	identityCard: z
		.string()
		.min(1, "Debe ingresar su cédula de identidad")
		.regex(/^\d+$/, "Debe contener solo números"),
	username: z
		.string()
		.min(1, "Debe ingresar un nombre de usuario")
		.min(5, "El nombre de usuario debe tener como mínimo 5 caracteres"),
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
	identityCard: z
		.string()
		.min(1, "Debe ingresar su cédula de identidad")
		.regex(/^\d+$/, "Debe contener solo números"),
});

export const teacherSchema = personSchema.extend({
	specialty: z.string().min(1, "Debe ingresar su especialidad"),
});

const parseDate = (value: unknown) => new Date(String(value));

export const academicPeriodSchema = z.object({
	startDate: z.preprocess(parseDate, z.date()),
	endDate: z.preprocess(parseDate, z.date()),
});
