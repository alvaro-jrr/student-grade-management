import Article from "~/components/article";
import Card from "~/components/card";
import { Button } from "~/components/button";
import { TextField } from "~/components/form-elements";

export default function LoginRoute() {
	return (
		<Article title="Iniciar Sesión">
			<Card variant="elevated">
				<TextField
					type="email"
					label="Email"
					name="email"
					placeholder="ej: johndoe@gmail.com"
				/>

				<TextField
					type="password"
					label="Contraseña"
					name="password"
					placeholder="ej: 123456"
				/>

				<Button width="full">Acceder</Button>
			</Card>
		</Article>
	);
}
