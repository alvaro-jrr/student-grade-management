import type { ActionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button } from "~/components/button";
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
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear estudiante"
				supportingText="Un estudiante puede inscribirse y realizar evaluaciones"
			>
				<Form schema={studentSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										error={errors.firstname?.message}
										label="Nombre"
										placeholder="ej: Carolina"
										{...register("firstname")}
									/>

									<TextField
										error={errors.lastname?.message}
										placeholder="ej: Giraldo"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 0516"
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
