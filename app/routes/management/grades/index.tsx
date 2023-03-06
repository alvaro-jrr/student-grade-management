import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);

	// Get teacher identity card
	const teacherIdentityCard =
		user.role === "TEACHER" ? user.identityCard : undefined;

	// Get grades
	const grades = await db.grade.findMany({
		where: {
			assignment: {
				academicLoad: {
					teacherIdentityCard,
				},
			},
		},
		select: {
			id: true,
			student: {
				select: {
					identityCard: true,
					person: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
				},
			},
			score: true,
			note: true,
			assignment: {
				select: {
					weight: true,
					description: true,
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
									studyYear: {
										select: {
											year: true,
										},
									},
									title: true,
								},
							},
						},
					},
					lapse: {
						select: {
							description: true,
						},
					},
				},
			},
		},
	});

	return json({
		grades,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	score: number;
	note: string;
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	assignment: {
		academicLoad: {
			academicPeriod: {
				startDate: string;
				endDate: string;
			};
			course: {
				title: string;
				studyYear: {
					year: number;
				};
			};
		};
		lapse: {
			description: number;
		};
		description: string;
		weight: number;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("assignment.academicLoad.academicPeriod", {
		header: "Periodo",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return getAcademicPeriodRange(startDate, endDate);
		},
	}),
	columnHelper.accessor("assignment.academicLoad.course.studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("assignment.academicLoad.course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("assignment.lapse.description", {
		header: "Lapso",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("assignment.description", {
		header: "Evaluación",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("assignment.weight", {
		header: "Peso",
		cell: (info) => info.getValue(),
	}),

	columnHelper.accessor("score", {
		header: "Nota",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("note", {
		header: "Observación",
		cell: (info) => info.getValue(),
	}),
];

export default function GradesIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.grades} />;
}
