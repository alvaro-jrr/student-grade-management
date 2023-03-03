import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { ButtonLink } from "~/components/button";
import { dateFormat, findActiveAcademicPeriod } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	// Get academic periods
	const academicPeriods = await db.academicPeriod.findMany({
		select: { id: true, startDate: true, endDate: true },
		orderBy: { startDate: "desc" },
	});

	// Get active
	const activeAcademicPeriod = await findActiveAcademicPeriod();

	return json({
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => {
			return {
				id,
				startDate: dateFormat(startDate),
				endDate: dateFormat(endDate),
				isActive: activeAcademicPeriod
					? activeAcademicPeriod.id === id
					: false,
			};
		}),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	startDate: string;
	endDate: string;
	isActive: boolean;
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
	columnHelper.accessor("isActive", {
		header: "",
		cell: (info) => {
			const isActive = info.getValue();

			if (!isActive) return;

			return (
				<div className="w-fit rounded-full bg-green-50 px-2 py-1">
					<p className="text-sm font-medium text-green-500">Activo</p>
				</div>
			);
		},
	}),
	columnHelper.accessor("id", {
		header: "",
		cell: (info) => {
			const id = info.getValue();

			return (
				<div className="flex justify-end">
					<ButtonLink to={`edit/${id}`} variant="text">
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function AcademicPeriodsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.academicPeriods} />;
}
