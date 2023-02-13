import type { ActionArgs } from "@remix-run/node";
import Card from "~/components/card";
import { Button } from "~/components/button";
import { TextField } from "~/components/form-elements";
import { Form, useSearchParams, useActionData, Link } from "@remix-run/react";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login } from "~/utils/session.server";
import { H2, Paragraph } from "~/components/typography";

function validateUsername(username: unknown) {
	if (typeof username !== "string" || username.length < 3) {
		return "Nombres de usuario deben tener al menos 3 caracteres";
	}
}

function validatePassword(password: unknown) {
	if (typeof password !== "string" || password.length < 6) {
		return "Contraseñas deben tener al menos 6 caracteres";
	}
}

function validateUrl(url: string) {
	const urls = ["/management"];

	return urls.includes(url) ? url : "/management";
}

export const action = async ({ request }: ActionArgs) => {
	const form = await request.formData();

	// Get each value
	const username = form.get("username");
	const password = form.get("password");
	const redirectTo = form.get("redirectTo");

	// Verify type
	if (
		typeof username !== "string" ||
		typeof password !== "string" ||
		typeof redirectTo !== "string"
	) {
		return badRequest({
			fieldErrors: null,
			fields: null,
			formError: "Formulario no enviado correctamente",
		});
	}

	const fields = { username, password, redirectTo };

	// Find if there's an error
	const fieldErrors = {
		username: validateUsername(username),
		password: validatePassword(password),
	};

	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({
			fieldErrors,
			fields,
			formError: null,
		});
	}

	// Try to log in the user
	const user = await login({ username, password });

	if (!user) {
		return badRequest({
			fieldErrors: null,
			fields,
			formError: "Email o contraseña son incorrectos",
		});
	}

	return createUserSession(user.id, validateUrl(redirectTo));
};

export default function LoginRoute() {
	const actionData = useActionData<typeof action>();
	const [searchParams] = useSearchParams();

	return (
		<div className="flex flex-col items-center justify-center h-full gap-y-8 py-28">
			<div className="space-y-2 sm:text-center">
				<H2>Iniciar Sesión</H2>

				<Paragraph>
					Accede a tu cuenta o{" "}
					<Link
						className="text-blue-500 transition-opacity hover:opacity-80"
						to="/register"
					>
						registrate
					</Link>{" "}
					para poder ingresar al sistema
				</Paragraph>
			</div>

			<Card variant="elevated">
				<Form method="post" className="space-y-6">
					<div className="space-y-4">
						<TextField
							error={actionData?.fieldErrors?.username}
							defaultValue={actionData?.fields?.username}
							type="text"
							label="Nombre de Usuario"
							name="username"
							placeholder="ej: johndoe"
						/>

						<TextField
							error={actionData?.fieldErrors?.password}
							defaultValue={actionData?.fields?.password}
							type="password"
							label="Contraseña"
							name="password"
							placeholder="ej: 123456"
						/>

						<input
							type="hidden"
							name="redirectTo"
							value={searchParams.get("redirectTo") ?? undefined}
						/>
					</div>

					<Button type="submit" width="full">
						Acceder
					</Button>
				</Form>
			</Card>
		</div>
	);
}
