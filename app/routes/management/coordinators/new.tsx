import { useNavigate } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";

const schema = z.object({});

export default function NewCoordinatorRoute() {
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear coordinador"
				supportingText="Un coordinador puede crear nuevos periodos académicos, aperturar secciones y asignar cargas"
			>
				<Form schema={schema}>
					{({ register }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										label="Nombre"
										placeholder="ej: Benito"
										name="firstname"
									/>

									<TextField
										placeholder="ej: Martinez"
										label="Apellido"
										name="lastname"
									/>
								</div>

								<TextField
									label="Cédula de Identidad"
									placeholder="ej: 25605"
									name="identityCard"
								/>

								<TextField
									label="Email"
									placeholder="ej: badbunny@gmail.com"
									name="email"
									type="email"
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
