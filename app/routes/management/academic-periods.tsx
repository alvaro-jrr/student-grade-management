import type { AcademicPeriod } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Section from "~/components/section";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	return json({
		academicPeriods: await db.academicPeriod.findMany({
			select: { id: true, startDate: true, endDate: true },
			orderBy: { startDate: "desc" },
		}),
	});
};

const columnHelper =
	createColumnHelper<Pick<AcademicPeriod, "id" | "startDate" | "endDate">>();

// Table columns
const columns = [
	columnHelper.accessor("startDate", {
		header: "Fecha de Inicio",
		cell: (info) => info.getValue().toString(),
	}),
	columnHelper.accessor("endDate", {
		header: "Fecha de Fin",
		cell: (info) => info.getValue().toString(),
	}),
];

export default function AcademicPeriodsRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<Section title="Periodos Académicos">
			{/** @ts-ignore  */}
			<Table columns={columns} data={data.academicPeriods} />
		</Section>
	);
}
