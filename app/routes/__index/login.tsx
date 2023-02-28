import type { ActionArgs } from "@remix-run/node";
import { z } from "zod";
import { createUserSession, login } from "~/utils/session.server";
import { performMutation } from "remix-forms";
import { useSearchParams, Link } from "@remix-run/react";
import { badRequest } from "~/utils/request.server";
import { makeDomainFunction } from "domain-functions";
import { Form } from "~/components/form";
import Card from "~/components/card";
import { Button } from "~/components/button";
import { TextField } from "~/components/form-elements";
import { H2, Paragraph } from "~/components/typography";
import { userSchema } from "~/schemas";

function validateUrl(url: string) {
	const urls = ["/management"];

	return urls.includes(url) ? url : "/management";
}

const loginSchema = userSchema.extend({
	redirectTo: z.optional(z.string()),
});

const mutation = makeDomainFunction(loginSchema)(
	async ({ username, password, redirectTo }) => {
		const userId = await login({ username, password });

		if (!userId) throw "Nombre de usuario o contraseña son incorrectos";

		return {
			userId,
			redirectTo: validateUrl(redirectTo || ""),
		};
	}
);

export const action = async ({ request }: ActionArgs) => {
	// Mutate form
	const result = await performMutation({
		request,
		schema: loginSchema,
		mutation,
	});

	if (!result.success) return badRequest(result);

	// Get result
	const { userId, redirectTo } = result.data;

	return createUserSession(userId, redirectTo);
};

export default function LoginRoute() {
	const [searchParams] = useSearchParams();

	return (
		<section className="flex h-full flex-col justify-center gap-y-8 py-28 sm:items-center">
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
				<Form schema={loginSchema} method="post">
					{({ register, formState: { errors }, Errors }) => (
						<>
							<div className="space-y-4">
								<TextField
									type="text"
									error={errors.username?.message}
									label="Nombre de Usuario"
									placeholder="ej: johndoe"
									{...register("username")}
								/>

								<TextField
									type="password"
									label="Contraseña"
									error={errors.password?.message}
									placeholder="ej: 123456"
									{...register("password")}
								/>

								<input
									type="hidden"
									value={
										searchParams.get("redirectTo") ??
										undefined
									}
									{...register("redirectTo")}
								/>
							</div>

							<Errors />

							<Button type="submit" width="full">
								Acceder
							</Button>
						</>
					)}
				</Form>
			</Card>
		</section>
	);
}
