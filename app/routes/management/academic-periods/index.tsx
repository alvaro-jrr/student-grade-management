import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { format } from "date-fns";
import { ButtonLink } from "~/components/button";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	// Get academic periods
	const academicPeriods = await db.academicPeriod.findMany({
		select: { id: true, startDate: true, endDate: true },
		orderBy: { startDate: "desc" },
	});

	return json({
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => {
			return {
				id,
				startDate: format(startDate, "dd/MM/yyyy"),
				endDate: format(endDate, "dd/MM/yyyy"),
			};
		}),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	startDate: string;
	endDate: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("startDate", {
		header: "Fecha de Inicio",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("endDate", {
		header: "Fecha de Fin",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("id", {
		header: "",
		cell: (info) => {
			const id = info.getValue();

			return (
				<ButtonLink to={`edit/${id}`} variant="text">
					Editar
				</ButtonLink>
			);
		},
	}),
];

export default function AcademicPeriodsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.academicPeriods} />;
}
