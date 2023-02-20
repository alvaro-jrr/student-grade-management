import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function CoordinatorsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear coordinador</ButtonLink>
			)}
			description="Visualiza, agrega o edita los coordinadores de la institución"
			title="Coordinadores"
		>
			<Outlet />
		</Section>
	);
}
