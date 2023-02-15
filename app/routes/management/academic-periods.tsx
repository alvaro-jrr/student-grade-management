import { Outlet } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";

export default function AcademicPeriodsRoute() {
	return (
		<Section
			ActionComponent={() => (
				<ButtonLink to="new">Crear periodo</ButtonLink>
			)}
			description="Visualiza, agrega o edita los periodos académicos de la institución"
			title="Periodos Académicos"
		>
			<Outlet />
		</Section>
	);
}
