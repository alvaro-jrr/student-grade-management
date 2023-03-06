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
import { getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);
	const url = new URL(request.url);

	// Get teacher identity card
	const teacherIdentityCard =
		user.role === "TEACHER" ? user.identityCard : undefined;

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

	// Get grades
	const grades = await db.grade.findMany({
		where: {
			assignment: {
				academicLoad: {
					teacherIdentityCard,
					academicPeriodId: academicPeriodId
						? Number(academicPeriodId)
						: undefined,
					courseId: courseId ? Number(courseId) : undefined,
					course: {
						studyYearId: studyYearId
							? Number(studyYearId)
							: undefined,
					},
				},
				lapseId: lapseId ? Number(lapseId) : undefined,
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
		courseId,
		lapseId,
		studyYearId,
		courses,
		lapses,
		studyYears,
		grades,
		academicPeriods,
		academicPeriodId,
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
	columnHelper.accessor("student.person", {
		header: "Estudiante",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
	}),
	columnHelper.accessor("student.identityCard", {
		header: "Cédula",
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
];

export default function GradesIndexRoute() {
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
						const isFirstSearch = data.academicPeriodId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<Select
						label="Periodo Académico"
						name="academic-period"
						placeholder="Seleccione un periodo"
						options={data.academicPeriods.map(
							({ id, startDate, endDate }) => ({
								name: getAcademicPeriodRange(
									startDate,
									endDate
								),
								value: id,
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

			<Table columns={columns} data={data.grades} />
		</div>
	);
}
