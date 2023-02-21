import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { personSchema } from "~/schemas";
import { db } from "~/utils/db.server";

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
	const { coordinator } = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (!coordinator) {
		return <p>not found</p>;
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar coordinador"
				supportingText="Actualiza los datos de un coordinador requerido"
			>
				<Form schema={personSchema} method="post" values={coordinator}>
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
