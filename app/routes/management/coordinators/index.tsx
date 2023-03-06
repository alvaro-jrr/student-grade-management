import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { Button, ButtonLink } from "~/components/button";
import { dateFormat } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["ADMIN"]);

	const coordinators = await db.coordinator.findMany({
		select: {
			entryDate: true,
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
			retirementDate: true,
			isActive: true,
		},
	});

	return json({
		coordinators,
	});
};

const columnHelper = createColumnHelper<{
	identityCard: string;
	entryDate: string;
	retirementDate: string | null;
	isActive: boolean;
	person: {
		firstname: string;
		lastname: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("person", {
		header: "Nombre Completo",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
	}),
	columnHelper.accessor("identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("entryDate", {
		header: "Fecha de Ingreso",
		cell: (info) => dateFormat(info.getValue()),
	}),
	columnHelper.accessor("retirementDate", {
		header: "Fecha de Retiro",
		cell: (info) => {
			const retirementDate = info.getValue();

			if (retirementDate) return dateFormat(retirementDate);

			return "";
		},
	}),
	columnHelper.accessor("identityCard", {
		id: "actions",
		header: "",
		cell: (info) => {
			const identityCard = info.getValue();
			const isActive = info.cell.row.original.isActive;

			return (
				<div className="flex justify-end gap-x-4">
					<ButtonLink variant="text" to={`edit/${identityCard}`}>
						Editar
					</ButtonLink>

					{isActive ? (
						<Form action={`retire/${identityCard}`} method="post">
							<Button variant="danger" type="submit">
								Retirar
							</Button>
						</Form>
					) : null}
				</div>
			);
		},
	}),
];

export default function CoordinatorsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.coordinators} />;
}
