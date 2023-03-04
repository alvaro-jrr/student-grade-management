import type { ActionArgs } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { personSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const mutation = makeDomainFunction(personSchema)(
	async ({ firstname, lastname, identityCard }) => {
		const identityCardExists = await isIdentityCardStored(identityCard);

		// In case identity card is already taken
		if (identityCardExists) {
			throw "Cédula de identidad ya ha sido registrada anteriormente";
		}

		return await db.person.create({
			data: {
				firstname,
				identityCard,
				lastname,
				role: "COORDINATOR",
				coordinator: {
					create: {},
				},
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: personSchema,
		mutation,
		successPath: "/management/coordinators",
	});
};

export default function NewCoordinatorRoute() {
	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear coordinador"
				supportingText="Un coordinador puede crear nuevos periodos académicos, aperturar secciones y asignar cargas"
			>
				<Form schema={personSchema}>
					{({ Errors, register, formState: { errors } }) => (
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
							</div>

							<Errors />

							<div className="flex justify-end gap-4">
								<ButtonLink
									type="button"
									variant="secondary"
									to="/management/coordinators"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
