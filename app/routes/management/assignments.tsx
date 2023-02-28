import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Section from "~/components/section";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);

	return json({ user });
};

export default function AssignmentsRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<Section
			ActionComponent={
				data.user.role === "COORDINATOR"
					? undefined
					: () => <ButtonLink to="new">Crear evaluación</ButtonLink>
			}
			description="Visualiza, agrega o edita evaluaciones de tus asignaturas"
			title="Evaluaciones"
		>
			<Outlet />
		</Section>
	);
}
