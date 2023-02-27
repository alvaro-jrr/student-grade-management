import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function RepresentativesRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear representación</ButtonLink>
			)}
			description="Visualiza, agrega o elimina la relación entre un estudiante y un representante"
			title="Representaciones"
		>
			<Outlet />
		</Section>
	);
}
