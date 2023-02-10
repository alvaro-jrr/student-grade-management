import type { ActionArgs } from "@remix-run/node";
import Article from "~/components/article";
import Card from "~/components/card";
import { Button } from "~/components/button";
import { TextField } from "~/components/form-elements";
import { Form, useSearchParams, useActionData } from "@remix-run/react";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login } from "~/utils/session.server";
import { H2 } from "~/components/typography";

function validateEmail(email: unknown) {
	if (typeof email !== "string" || email.length < 3) {
		return "Emails deben tener al menos 3 caracteres";
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
	const email = form.get("email");
	const password = form.get("password");
	const redirectTo = form.get("redirectTo");

	// Verify type
	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		typeof redirectTo !== "string"
	) {
		return badRequest({
			fieldErrors: null,
			fields: null,
			formError: "Formulario no enviado correctamente",
		});
	}

	const fields = { email, password, redirectTo };

	// Find if there's an error
	const fieldErrors = {
		email: validateEmail(email),
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
	const user = await login({ email, password });

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
		<div className="flex flex-col items-center gap-y-4 py-28">
			<H2>Iniciar Sesión</H2>

			<Card variant="elevated">
				<Form method="post" className="space-y-6">
					<div className="space-y-4">
						<TextField
							error={actionData?.fieldErrors?.email}
							defaultValue={actionData?.fields?.email}
							type="email"
							label="Email"
							name="email"
							placeholder="ej: johndoe@gmail.com"
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
