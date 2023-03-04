import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function EnrrollmentsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear inscripción</ButtonLink>
			)}
			description="Visualiza o agrega las inscripciones del periodo"
			title="Inscripciones"
		>
			<Outlet />
		</Section>
	);
}
