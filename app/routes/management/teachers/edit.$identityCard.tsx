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
import { teacherSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const editTeacherSchema = teacherSchema.extend({
	currentIdentityCard: z.string(),
});

const mutation = makeDomainFunction(editTeacherSchema)(
	async ({
		identityCard,
		specialty,
		currentIdentityCard,
		firstname,
		lastname,
	}) => {
		let identityCardTaken = true;

		// Check if there's change between IDs
		if (identityCard !== currentIdentityCard) {
			identityCardTaken = await isIdentityCardStored(identityCard);
		}

		if (identityCardTaken)
			throw "La nueva cédula de identidad ya ha sido tomada";

		const user = await db.user.findUnique({
			where: { identityCard: currentIdentityCard },
		});

		// Update identity card in user, in case coordinator has user
		if (user) {
			await db.user.update({
				where: { identityCard: currentIdentityCard },
				data: {
					identityCard,
				},
			});
		}

		return await db.teacher.update({
			where: { identityCard: currentIdentityCard },
			data: {
				specialty,
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

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: editTeacherSchema,
		mutation,
		successPath: "/management/teachers",
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = String(params.identityCard);

	const teacher = await db.teacher.findUnique({
		where: { identityCard },
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			specialty: true,
		},
	});

	return json({
		teacher: teacher
			? {
					identityCard,
					firstname: teacher.person.firstname,
					lastname: teacher.person.lastname,
					specialty: teacher.specialty,
			  }
			: null,
	});
};

export default function EditTeacherRoute() {
	const identityCard = useParams().identityCard;
	const { teacher } = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (!teacher) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					to="/management/teachers"
					description={`Docente con cédula de identidad ${identityCard} no ha sido
						encontrado`}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar docente"
				supportingText="Actualiza los datos de un docente requerido"
			>
				<Form
					schema={editTeacherSchema}
					method="post"
					values={{
						...teacher,
						currentIdentityCard: teacher.identityCard,
					}}
				>
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

								<input
									type="hidden"
									{...register("currentIdentityCard")}
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
