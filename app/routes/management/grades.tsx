import type { LoaderArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import { requireUserWithRole } from "~/utils/session.server";
import Section from "~/components/section";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);

	return json({ user });
};

export default function GradesRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<Section
			ActionComponent={
				data.user.role === "COORDINATOR"
					? undefined
					: () => <ButtonLink to="new">Asignar nota</ButtonLink>
			}
			description="Visualiza, agrega o edita los notas de la evaluaciones"
			title="Notas"
		>
			<Outlet />
		</Section>
	);
}
