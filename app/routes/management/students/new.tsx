import type { ActionArgs } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { studentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const mutation = makeDomainFunction(studentSchema)(
	async ({ firstname, lastname, identityCard, birthDate }) => {
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
				role: "STUDENT",
				student: {
					create: {
						birthDate,
					},
				},
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: studentSchema,
		mutation,
		successPath: "/management/students",
	});
};

export default function NewStudentRoute() {
	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear estudiante"
				supportingText="Un estudiante puede inscribirse y realizar evaluaciones"
			>
				<Form method="post" schema={studentSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										error={errors.firstname?.message}
										label="Nombre"
										placeholder="ej: John"
										{...register("firstname")}
									/>

									<TextField
										error={errors.lastname?.message}
										placeholder="ej: Doe"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 28385587"
									{...register("identityCard")}
								/>

								<TextField
									error={errors.birthDate?.message}
									type="date"
									label="Fecha de Nacimiento"
									{...register("birthDate")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-4">
								<ButtonLink
									variant="secondary"
									to="/management/students"
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
