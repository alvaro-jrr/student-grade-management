import type { ActionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Form } from "~/components/form";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { TextField } from "~/components/form-elements";
import { H2, Paragraph } from "~/components/typography";
import { db } from "~/utils/db.server";
import {
	isIdentityCardStored,
	register,
	createUserSession,
} from "~/utils/session.server";
import { badRequest } from "~/utils/request.server";
import { registerSchema } from "~/schemas";

const mutation = makeDomainFunction(registerSchema)(
	async ({ identityCard, username, password }) => {
		// Check if identity card exists
		const identityCardExists = await isIdentityCardStored(identityCard);

		if (!identityCardExists)
			throw `Cédula de identidad ${identityCard} no ha sido encontrada`;

		// Check if user with that identity card exists
		const userExists = await db.user.findUnique({
			where: { identityCard },
		});

		if (userExists)
			throw `Usuario con cédula de identidad ${identityCard} ya existe`;

		// Check if username is taken
		const usernameExists = await db.user.findUnique({
			where: { username },
		});

		if (usernameExists)
			throw `Usuario con nombre de usuario ${username} ya existe`;

		// Create user
		const user = await register({ username, identityCard, password });

		if (!user) throw "Error al crear usuario";

		return { user };
	}
);

export const action = async ({ request }: ActionArgs) => {
	// Mutate form
	const result = await performMutation({
		request,
		schema: registerSchema,
		mutation,
	});

	if (!result.success) return badRequest(result);

	const { user } = result.data;

	return createUserSession(user.id, "/management");
};

export default function Register() {
	return (
		<section className="flex h-full flex-col justify-center gap-y-8 py-28 sm:items-center">
			<div className="space-y-2 sm:text-center">
				<H2>Crea tu cuenta</H2>

				<Paragraph>
					Registrate o{" "}
					<Link
						className="text-blue-500 transition-opacity hover:opacity-80"
						to="/login"
					>
						inicia sesión
					</Link>{" "}
					si ya posees una cuenta
				</Paragraph>
			</div>

			<Card variant="elevated">
				<Form schema={registerSchema} method="post">
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									supportingText="Debe contener únicamente dígitos"
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 28385587"
									type="text"
									{...register("identityCard")}
								/>

								<TextField
									supportingText="Debe tener al menos cinco caracteres"
									error={errors.username?.message}
									placeholder="ej: johndoe"
									label="Nombre de Usuario"
									type="text"
									{...register("username")}
								/>

								<TextField
									supportingText="Debe tener al menos cinco caracteres"
									error={errors.password?.message}
									label="Contraseña"
									placeholder="ej: 123456"
									type="password"
									{...register("password")}
								/>
							</div>

							<Errors />

							<Button type="submit" width="full">
								Registrarse
							</Button>
						</>
					)}
				</Form>
			</Card>
		</section>
	);
}
