import type { LoaderArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import { requireUserWithRole } from "~/utils/session.server";
import Section from "~/components/section";
import { json } from "@remix-run/node";
import type { RoleName } from "@prisma/client";

interface Link {
	name: string;
	to: string;
	roles: RoleName[];
}

const LINKS: Link[] = [
	{
		name: "Todas",
		to: "all",
		roles: ["COORDINATOR", "TEACHER"],
	},
	{
		name: "Resumen por Sección",
		to: "sections-summary",
		roles: ["COORDINATOR"],
	},
	{
		name: "Finales",
		to: "finals",
		roles: ["COORDINATOR"],
	},
	{
		name: "Boletín",
		to: "students-bulletin",
		roles: ["COORDINATOR", "REPRESENTATIVE"],
	},
];

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, [
		"COORDINATOR",
		"TEACHER",
		"REPRESENTATIVE",
	]);

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
			routes={LINKS.filter((link) => link.roles.includes(data.user.role))}
		>
			<Outlet />
		</Section>
	);
}
