import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const representatives = await db.representative.findMany({
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
			email: true,
			phoneNumber: true,
		},
	});

	return json({
		representatives: representatives.map(
			({ person: { firstname, lastname }, ...restOfRepresentative }) => ({
				fullname: `${firstname} ${lastname}`,
				...restOfRepresentative,
			})
		),
	});
};

const columnHelper = createColumnHelper<{
	identityCard: string;
	email: string;
	fullname: string;
	phoneNumber: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("fullname", {
		header: "Nombre Completo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("email", {
		header: "Email",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("phoneNumber", {
		header: "Telefono",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		id: "actions",
		header: "",
		cell: (info) => {
			const identityCard = info.getValue();

			return (
				<div className="flex justify-end">
					<ButtonLink variant="text" to={`edit/${identityCard}`}>
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function RepresentativesIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.representatives} />;
}
