import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["ADMIN", "COORDINATOR", "TEACHER"]);

	const evaluations = await db.assignment.findMany({
		select: {
			id: true,
			description: true,
			weight: true,
			lapse: {
				select: {
					description: true,
				},
			},
			academicLoad: {
				select: {
					course: {
						select: {
							title: true,
							studyYear: {
								select: {
									year: true,
								},
							},
						},
					},
				},
			},
		},
	});

	return json({
		evaluations,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	description: string;
	weight: number;
	lapse: {
		description: number;
	};
	academicLoad: {
		course: {
			title: string;
			studyYear: {
				year: number;
			};
		};
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("description", {
		header: "Evaluación",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("weight", {
		header: "Peso",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("academicLoad.course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("academicLoad.course.studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("lapse.description", {
		header: "Lapso",
		cell: (info) => info.getValue(),
	}),
];

export default function EvaluationsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.evaluations} />;
}
