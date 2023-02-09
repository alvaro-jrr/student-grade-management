import { ButtonLink } from "~/components/button";
import { H2, Paragraph } from "~/components/typography";

export default function IndexRoute() {
	return (
		<>
			<header className="flex flex-col gap-y-6 py-[7.5rem] md:gap-y-8">
				<div className="flex flex-col gap-y-4 lg:text-center">
					<H2>Educación de calidad para todos</H2>

					<Paragraph size="large">
						Contamos con el mejor personal docente y las mejores
						áreas para ofrecer un mejor futuro para tus hijos
					</Paragraph>
				</div>

				<div className="flex flex-col gap-4 md:flex-row lg:justify-center">
					<ButtonLink>Conocer más</ButtonLink>

					<ButtonLink variant="secondary">
						Explorar asignaturas
					</ButtonLink>
				</div>
			</header>
		</>
	);
}
