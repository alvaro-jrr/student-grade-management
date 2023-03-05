import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function GradesRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Asignar nota</ButtonLink>
			)}
			description="Visualiza, agrega o edita los notas de la evaluaciones"
			title="Notas"
		>
			<Outlet />
		</Section>
	);
}
