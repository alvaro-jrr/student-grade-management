import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createColumnHelper } from "@tanstack/react-table";
import { useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const sections = await db.section.findMany({
		select: {
			id: true,
			description: true,
			academicPeriod: {
				select: {
					startDate: true,
					endDate: true,
				},
			},
			studyYear: {
				select: {
					year: true,
				},
			},
		},
	});

	return json({
		sections: sections.map(
			({ academicPeriod: { startDate, endDate }, ...restOfSection }) => ({
				academicPeriod: {
					range: getAcademicPeriodRange(startDate, endDate),
				},
				...restOfSection,
			})
		),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	description: string;
	studyYear: {
		year: number;
	};
	academicPeriod: {
		range: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("academicPeriod.range", {
		header: "Periodo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("description", {
		header: "Sección",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("id", {
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

export default function SectionsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.sections} />;
}
