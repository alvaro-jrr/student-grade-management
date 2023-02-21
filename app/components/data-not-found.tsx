import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Card from "./card";
import { Paragraph } from "./typography";
import wrongPageUrl from "~/assets/wrong-page.png";
import { ButtonLink } from "./button";

export default function DataNotFound({
	description,
	to,
}: {
	description: string;
	to: string;
}) {
	return (
		<Card title="Oops! Ha ocurrido un error" supportingText={description}>
			<img
				src={wrongPageUrl}
				className="mx-auto w-full max-w-[15rem]"
				alt="Juguetes colocados de forma incorrecta"
			/>

			<div className="flex flex-col gap-y-4">
				<div className="flex items-center gap-x-4">
					<ExclamationCircleIcon className="h-6 w-6 flex-shrink-0 text-slate-500" />

					<Paragraph>
						Intente nuevamente más tarde o contacte al administrador
						del sistema
					</Paragraph>
				</div>

				<ButtonLink variant="secondary" width="full" to={to}>
					Ir a otra página
				</ButtonLink>
			</div>
		</Card>
	);
}
