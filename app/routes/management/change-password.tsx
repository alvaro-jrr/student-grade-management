import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import Section from "~/components/section";
import { changePasswordSchema } from "~/schemas";
import { formAction } from "~/utils/form-action.server";
import { changePassword, requireUserWithRole } from "~/utils/session.server";

const changePasswordWithUsernameSchema = changePasswordSchema.extend({
	username: z.string(),
});

const mutation = makeDomainFunction(changePasswordWithUsernameSchema)(
	async ({ username, currentPassword, newPassword }) => {
		const user = await changePassword({
			username,
			currentPassword,
			newPassword,
		});

		// In case current password doesn't match
		if (!user) {
			throw new InputError(
				"Contraseña no coincide con la actual",
				"currentPassword"
			);
		}

		return user;
	}
);

export const action = async ({ request }: ActionArgs) => {
	const user = await requireUserWithRole(request, ["TEACHER"]);

	return formAction({
		request,
		schema: changePasswordSchema,
		mutation,
		successPath: "/login",
		transformValues: (values) => ({ ...values, username: user.username }),
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["TEACHER"]);

	return null;
};

export default function ChangePasswordRoute() {
	return (
		<Section
			title="Cambiar Contraseña"
			description="Modifica la contraseña actual de tu usuario"
		>
			<div className="flex h-full items-center justify-center">
				<Card>
					<Form method="post" schema={changePasswordSchema}>
						{({ register, formState: { errors } }) => (
							<>
								<div className="space-y-4">
									<TextField
										error={errors.currentPassword?.message}
										label="Contraseña Actual"
										type="password"
										placeholder="ej: abcdef"
										{...register("currentPassword")}
									/>

									<TextField
										error={errors.newPassword?.message}
										label="Nueva Contraseña"
										type="password"
										placeholder="ej: 12345"
										{...register("newPassword")}
									/>
								</div>

								<div className="flex justify-end">
									<Button type="submit">Cambiar</Button>
								</div>
							</>
						)}
					</Form>
				</Card>
			</div>
		</Section>
	);
}
