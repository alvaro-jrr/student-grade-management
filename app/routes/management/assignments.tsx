import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function AssignmentsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear evaluación</ButtonLink>
			)}
			description="Visualiza, agrega o edita evaluaciones de tus asignaturas"
			title="Evaluaciones"
		>
			<Outlet />
		</Section>
	);
}
