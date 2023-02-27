import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function RepresentativesRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear representante</ButtonLink>
			)}
			description="Visualiza, agrega o edita los representantes de la institución"
			title="Representantes"
		>
			<Outlet />
		</Section>
	);
}
