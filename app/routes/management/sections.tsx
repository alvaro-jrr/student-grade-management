import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function SectionsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear sección</ButtonLink>
			)}
			description="Visualiza, agrega o edita las secciones de la institución"
			title="Secciones"
		>
			<Outlet />
		</Section>
	);
}
