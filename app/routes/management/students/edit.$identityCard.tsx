import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import DataNotFound from "~/components/data-not-found";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { studentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const editStudentSchema = studentSchema.extend({
	currentIdentityCard: z.string(),
});

const mutation = makeDomainFunction(editStudentSchema)(
	async ({
		firstname,
		identityCard,
		lastname,
		birthDate,
		currentIdentityCard,
	}) => {
		// Check if there's change between IDs
		if (
			identityCard !== currentIdentityCard &&
			(await isIdentityCardStored(identityCard))
		) {
			throw "La nueva cédula de identidad ya ha sido tomada";
		}

		return await db.student.update({
			where: { identityCard: currentIdentityCard },
			data: {
				birthDate,
				person: {
					update: {
						firstname,
						lastname,
						identityCard,
					},
				},
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const identityCard = String(params.identityCard);

	return formAction({
		request,
		schema: studentSchema,
		mutation,
		transformValues: (values) => ({
			...values,
			currentIdentityCard: identityCard,
		}),
		successPath: "/management/students",
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = String(params.identityCard);

	const student = await db.student.findUnique({
		where: { identityCard },
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			birthDate: true,
		},
	});

	return json({
		student: student
			? {
					identityCard,
					firstname: student.person.firstname,
					lastname: student.person.lastname,
					birthDate: student.birthDate,
			  }
			: null,
	});
};

export default function EditCoordinatorRoute() {
	const identityCard = useParams().identityCard;
	const { student } = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (!student) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					to="/management/students"
					description={`Estudiante con cédula de identidad ${identityCard} no ha sido
						encontrado`}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar estudiante"
				supportingText="Actualiza los datos de un estudiante requerido"
			>
				<Form schema={studentSchema} values={student}>
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
