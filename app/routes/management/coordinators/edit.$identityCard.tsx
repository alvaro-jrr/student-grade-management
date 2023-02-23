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
import { personSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const editCoordinatorSchema = personSchema.extend({
	currentIdentityCard: z.string(),
});

const mutation = makeDomainFunction(editCoordinatorSchema)(
	async ({ firstname, identityCard, lastname, currentIdentityCard }) => {
		// Check if there's change between IDs
		if (
			identityCard !== currentIdentityCard &&
			(await isIdentityCardStored(identityCard))
		) {
			throw "La nueva cédula de identidad ya ha sido tomada";
		}

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

		return await db.person.update({
			where: { identityCard: currentIdentityCard },
			data: {
				firstname,
				lastname,
				identityCard,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const identityCard = String(params.identityCard);

	return formAction({
		request,
		schema: personSchema,
		mutation,
		successPath: "/management/coordinators",
		transformValues: (values) => ({
			...values,
			currentIdentityCard: identityCard,
		}),
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = String(params.identityCard);

	const coordinator = await db.coordinator.findUnique({
		where: { identityCard },
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
		},
	});

	return json({
		coordinator: coordinator
			? {
					identityCard,
					firstname: coordinator.person.firstname,
					lastname: coordinator.person.lastname,
			  }
			: null,
	});
};

export default function EditCoordinatorRoute() {
	const data = useLoaderData<typeof loader>();
	const identityCard = useParams().identityCard;
	const navigate = useNavigate();

	if (!data.coordinator) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					to="/management/coordinators"
					description={`Coordinador con cédula de identidad ${identityCard} no ha sido
						encontrado`}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar coordinador"
				supportingText="Actualiza los datos de un coordinador requerido"
			>
				<Form
					schema={personSchema}
					method="post"
					values={data.coordinator}
				>
					{({ register }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										type="text"
										label="Nombre"
										placeholder="ej: Benito"
										{...register("firstname")}
									/>

									<TextField
										placeholder="ej: Martinez"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									label="Cédula de Identidad"
									placeholder="ej: 25605"
									{...register("identityCard")}
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
