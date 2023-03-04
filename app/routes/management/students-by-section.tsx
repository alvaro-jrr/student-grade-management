import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function StudentsBySectionRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Asignar a una sección</ButtonLink>
			)}
			description="Visualiza, agrega o edita los estudiantes de una sección"
			title="Estudiantes por Sección"
		>
			<Outlet />
		</Section>
	);
}
