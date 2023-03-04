import type { ActionArgs } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { teacherSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const mutation = makeDomainFunction(teacherSchema)(
	async ({ firstname, lastname, identityCard, specialty }) => {
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
				role: "TEACHER",
				teacher: {
					create: {
						specialty,
					},
				},
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: teacherSchema,
		mutation,
		successPath: "/management/teachers",
	});
};

export default function NewTeacherRoute() {
	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear docente"
				supportingText="Un docente imparte asignaturas y asigna evaluaciones"
			>
				<Form schema={teacherSchema}>
					{({ register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										error={errors.firstname?.message}
										label="Nombre"
										placeholder="ej: Cristiano"
										{...register("firstname")}
									/>

									<TextField
										error={errors.lastname?.message}
										placeholder="ej: Ronaldo"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 25600"
									{...register("identityCard")}
								/>

								<TextField
									error={errors.specialty?.message}
									label="Especialidad"
									placeholder="ej: Deporte"
									{...register("specialty")}
								/>
							</div>

							<div className="flex justify-end gap-4">
								<ButtonLink
									variant="secondary"
									to="/management/teachers"
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
