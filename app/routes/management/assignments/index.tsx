import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { getYear } from "date-fns";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);

	const evaluations = await db.assignment.findMany({
		where:
			user.role === "TEACHER"
				? {
						academicLoad: {
							teacherIdentityCard: user.identityCard,
						},
				  }
				: undefined,
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
					academicPeriod: {
						select: {
							startDate: true,
							endDate: true,
						},
					},
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
		orderBy: {
			academicLoad: {
				academicPeriod: {
					startDate: "desc",
				},
			},
		},
	});

	return json({
		evaluations: evaluations.map(
			({
				academicLoad: { academicPeriod, course },
				...restOfEvaluation
			}) => {
				// Format dates
				const periodStartDate = getYear(academicPeriod.startDate);
				const periodEndDate = getYear(academicPeriod.endDate);

				return {
					academicLoad: {
						academicPeriod: `${periodStartDate}-${periodEndDate}`,
						course,
					},
					...restOfEvaluation,
				};
			}
		),
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
		academicPeriod: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("academicLoad.academicPeriod", {
		header: "Periodo",
		cell: (info) => info.getValue(),
	}),
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
