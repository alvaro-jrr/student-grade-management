import { Form, Link } from "@remix-run/react";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { TextField } from "~/components/form-elements";
import { H2, Paragraph } from "~/components/typography";

export const action = () => null;

export default function Register() {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-y-8 py-28">
			<div className="space-y-2 sm:text-center">
				<H2>Crea tu cuenta</H2>

				<Paragraph>
					Registrate o{" "}
					<Link
						className="text-blue-500 transition-opacity hover:opacity-80"
						to="/login"
					>
						inicia sesión
					</Link>{" "}
					si ya posees una cuenta
				</Paragraph>
			</div>

			<Card variant="elevated">
				<Form method="post" className="space-y-6">
					<div className="space-y-4">
						<TextField
							type="text"
							label="Cédula de Identidad"
							name="identityCard"
							placeholder="ej: 28385587"
						/>

						<TextField
							type="text"
							label="Nombre de Usuario"
							name="username"
							placeholder="ej: johndoe"
						/>

						<TextField
							type="password"
							label="Contraseña"
							name="password"
							placeholder="ej: 123456"
						/>
					</div>

					<Button type="submit" width="full">
						Acceder
					</Button>
				</Form>
			</Card>
		</div>
	);
}
