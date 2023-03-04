import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
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

	if (!coordinator) {
		throw new Response("Coordinador no ha sido encontrado", {
			status: 404,
		});
	}

	return json({
		coordinator: {
			identityCard,
			firstname: coordinator.person.firstname,
			lastname: coordinator.person.lastname,
		},
	});
};

export default function EditCoordinatorRoute() {
	const data = useLoaderData<typeof loader>();

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
								<ButtonLink
									variant="secondary"
									to="/management/coordinators"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
