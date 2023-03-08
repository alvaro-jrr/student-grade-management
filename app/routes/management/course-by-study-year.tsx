import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function CourseByStudyYear() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Asignar asignatura</ButtonLink>
			)}
			description="Visualiza, agrega o edita las asignaturas por año"
			title="Asignatura por Año"
		>
			<Outlet />
		</Section>
	);
}
