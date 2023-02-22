import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function StudentsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear estudiante</ButtonLink>
			)}
			description="Visualiza, agrega o edita los estudiantes de la institución"
			title="Estudiantes"
		>
			<Outlet />
		</Section>
	);
}
