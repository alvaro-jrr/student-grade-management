import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function CoursesRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear asignatura</ButtonLink>
			)}
			description="Visualiza, agrega o edita las asignaturas de la institución"
			title="Asignaturas"
		>
			<Outlet />
		</Section>
	);
}
