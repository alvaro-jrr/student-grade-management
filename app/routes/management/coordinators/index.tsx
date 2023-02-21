import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { format } from "date-fns";
import { Button, ButtonLink } from "~/components/button";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

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
		coordinators: coordinators.map(
			({
				person: { firstname, lastname },
				entryDate,
				retirementDate,
				...restOfCoordinator
			}) => {
				return {
					fullname: `${firstname} ${lastname}`,
					entryDate: format(entryDate, "dd/MM/yyyy"),
					retirementDate: retirementDate
						? format(retirementDate, "dd/MM/yyyy")
						: "",
					...restOfCoordinator,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	fullname: string;
	identityCard: string;
	entryDate: string;
	retirementDate: string;
	isActive: boolean;
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
	columnHelper.accessor("entryDate", {
		header: "Fecha de Ingreso",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("retirementDate", {
		header: "Fecha de Retiro",
		cell: (info) => info.getValue() || "",
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

export default function AcademicPeriodsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.coordinators} />;
}
