import { FunnelIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import { Select } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);
	const url = new URL(request.url);

	// Get search params
	const academicPeriodId = url.searchParams.get("academic-period");
	const lapseId = url.searchParams.get("lapse");
	const courseId = url.searchParams.get("course");
	const studyYearId = url.searchParams.get("study-year");

	// Get lapses, periods, study years and courses
	const lapses = await db.lapse.findMany();
	const academicPeriods = await db.academicPeriod.findMany();
	const studyYears = await db.studyYear.findMany();
	const courses = await db.course.findMany({
		select: {
			id: true,
			title: true,
		},
	});

	// Get assignments
	const assignments = await db.assignment.findMany({
		where: {
			academicLoad: {
				academicPeriodId: academicPeriodId
					? Number(academicPeriodId)
					: undefined,
				courseByStudyYear: {
					courseId: courseId ? Number(courseId) : undefined,
					studyYearId: studyYearId ? Number(studyYearId) : undefined,
				},
				teacherIdentityCard:
					user.role === "TEACHER" ? user.identityCard : undefined,
			},
			lapseId: lapseId ? Number(lapseId) : undefined,
		},
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
					courseByStudyYear: {
						select: {
							course: {
								select: {
									title: true,
								},
							},
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
		academicPeriodId,
		courseId,
		lapseId,
		studyYearId,
		courses,
		lapses,
		studyYears,
		user,
		academicPeriods,
		assignments,
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
		courseByStudyYear: {
			studyYear: {
				year: number;
			};
			course: {
				title: string;
			};
		};
		academicPeriod: {
			startDate: string;
			endDate: string;
		};
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("academicLoad.academicPeriod", {
		header: "Periodo",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return academicPeriodInterval(startDate, endDate);
		},
	}),
	columnHelper.accessor("academicLoad.courseByStudyYear.studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("academicLoad.courseByStudyYear.course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("lapse.description", {
		header: "Lapso",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("description", {
		header: "Evaluación",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("weight", {
		header: "Ponderación",
		cell: (info) => info.getValue(),
	}),
];

const columnsWithEditLink = [
	...columns,
	...[
		columnHelper.accessor("id", {
			header: "",
			cell: (info) => {
				const id = info.getValue();

				return (
					<div className="flex justify-end">
						<ButtonLink variant="text" to={`edit/${id}`}>
							Editar
						</ButtonLink>
					</div>
				);
			},
		}),
	],
];

export default function EvaluationsIndexRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-center gap-4 md:flex-row md:items-center md:justify-start">
				<FunnelIcon className="h-6 w-6 text-gray-500" />

				<Form
					className="flex flex-col gap-4 md:flex-row"
					method="get"
					onChange={(event) => {
						const isFirstSearch =
							data.academicPeriodId === null &&
							data.lapseId === null &&
							data.studyYearId === null &&
							data.courseId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<Select
						label="Periodo Académico"
						name="academic-period"
						placeholder="Seleccione un periodo"
						defaultValue={data.academicPeriodId || ""}
						options={data.academicPeriods.map(
							({ id, startDate, endDate }) => ({
								value: id,
								name: academicPeriodInterval(
									startDate,
									endDate
								),
							})
						)}
					/>

					<Select
						label="Asignatura"
						name="course"
						placeholder="Seleccione una asignatura"
						defaultValue={data.courseId || ""}
						options={data.courses.map(({ id, title }) => ({
							value: id,
							name: title,
						}))}
					/>

					<Select
						label="Año"
						name="study-year"
						placeholder="Seleccione un año"
						defaultValue={data.studyYearId || ""}
						options={data.studyYears.map(({ id, year }) => ({
							value: id,
							name: year,
						}))}
					/>

					<Select
						label="Lapso"
						name="lapse"
						placeholder="Seleccione un lapso"
						defaultValue={data.lapseId || ""}
						options={data.lapses.map(({ id, description }) => ({
							value: id,
							name: description,
						}))}
					/>
				</Form>
			</div>

			{data.user.role === "COORDINATOR" ? (
				<Table columns={columnsWithEditLink} data={data.assignments} />
			) : (
				<Table columns={columns} data={data.assignments} />
			)}
		</div>
	);
}
