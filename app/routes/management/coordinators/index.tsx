import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { format } from "date-fns";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	const coordinators = await db.coordinator.findMany({
		orderBy: { firstname: "asc" },
		select: {
			firstname: true,
			lastname: true,
			email: true,
			entryDate: true,
			retirementDate: true,
			identityCard: true,
		},
	});

	return json({
		coordinators: coordinators.map(
			({
				entryDate,
				retirementDate,
				firstname,
				lastname,
				...restOfCoordinator
			}) => {
				return {
					entryDate: format(entryDate, "dd/MM/yyyy"),
					retirementDate: retirementDate
						? format(retirementDate, "dd/MM/yyyy")
						: "",
					fullname: `${firstname} ${lastname}`,
					...restOfCoordinator,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	fullname: string;
	email: string;
	identityCard: string;
	entryDate: string;
	retirementDate: string;
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
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("email", {
		header: "Email",
		cell: (info) => info.getValue(),
	}),
];

export default function AcademicPeriodsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.coordinators} />;
}
