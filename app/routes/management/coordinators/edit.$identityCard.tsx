import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { db } from "~/utils/db.server";

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

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = String(params.identityCard);

	return json({
		coordinator: await db.coordinator.findUnique({
			where: { identityCard },
			select: {
				firstname: true,
				lastname: true,
				identityCard: true,
				email: true,
			},
		}),
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
				<Form schema={schema} method="post" values={coordinator}>
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

								<TextField
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
