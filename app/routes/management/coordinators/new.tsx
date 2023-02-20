import type { ActionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isEmailUnique, isIdentityCardStored } from "~/utils/session.server";

const schema = z.object({
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
	email: z
		.string()
		.min(1, "Debe ingresar su email")
		.email("Debe ingresar un email valido"),
});

const mutation = makeDomainFunction(schema)(
	async ({ firstname, lastname, identityCard, email }) => {
		const identityCardExists = await isIdentityCardStored(identityCard);

		// In case identity card is already taken
		if (identityCardExists) {
			throw "Cédula de identidad ya ha sido registrada anteriormente";
		}

		const emailExists = await isEmailUnique(email);

		// In case email is already taken
		if (emailExists) throw "Email ya ha sido tomado";

		return await db.coordinator.create({
			data: {
				firstname,
				lastname,
				identityCard,
				email,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema,
		mutation,
		successPath: "/management/coordinators",
	});
};

export default function NewCoordinatorRoute() {
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear coordinador"
				supportingText="Un coordinador puede crear nuevos periodos académicos, aperturar secciones y asignar cargas"
			>
				<Form schema={schema}>
					{({ register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										error={errors.firstname?.message}
										label="Nombre"
										placeholder="ej: Benito"
										{...register("firstname")}
									/>

									<TextField
										error={errors.lastname?.message}
										placeholder="ej: Martinez"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 25605"
									{...register("identityCard")}
								/>

								<TextField
									error={errors.email?.message}
									label="Email"
									placeholder="ej: badbunny@gmail.com"
									type="email"
									{...register("email")}
								/>
							</div>

							<div className="flex justify-end gap-4">
								<Button
									type="button"
									variant="secondary"
									onClick={() => navigate(-1)}
								>
									Volver
								</Button>

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
