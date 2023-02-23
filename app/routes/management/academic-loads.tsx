import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function AcademicLoadsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear carga académica</ButtonLink>
			)}
			description="Visualiza, agrega o edita las cargas académicas de la institución"
			title="Cargas Académicas"
		>
			<Outlet />
		</Section>
	);
}
