import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function TeachersRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear docente</ButtonLink>
			)}
			description="Visualiza, agrega o edita los docentes de la institución"
			title="Docentes"
		>
			<Outlet />
		</Section>
	);
}
