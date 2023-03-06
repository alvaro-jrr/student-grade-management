import { FunnelIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import { Select, TextField } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const academicPeriodId = url.searchParams.get("academic-period");
	const studyYearId = url.searchParams.get("study-year");
	const studentId = url.searchParams.get("student-id");
	const section = url.searchParams.get("section");

	// Get periods and study years
	const academicPeriods = await db.academicPeriod.findMany();
	const studyYears = await db.studyYear.findMany();

	const studentsBySection = await db.studentBySection.findMany({
		where: {
			section: {
				studyYearId: studyYearId ? Number(studyYearId) : undefined,
				description: {
					startsWith: section || undefined,
				},
			},
			studentIdentityCard: {
				startsWith: studentId || undefined,
			},
		},
		select: {
			id: true,
			section: {
				select: {
					studyYear: {
						select: {
							year: true,
						},
					},
					academicPeriod: {
						select: {
							startDate: true,
							endDate: true,
						},
					},
					description: true,
				},
			},
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
		},
		orderBy: {
			section: {
				studyYear: {
					year: "desc",
				},
			},
		},
	});

	return json({
		section,
		studentId,
		academicPeriodId,
		studyYearId,
		academicPeriods,
		studyYears,
		studentsBySection,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	section: {
		academicPeriod: {
			startDate: string;
			endDate: string;
		};
		description: string;
		studyYear: {
			year: number;
		};
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("section.academicPeriod", {
		header: "Periodo",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return getAcademicPeriodRange(startDate, endDate);
		},
	}),
	columnHelper.accessor("section", {
		header: "Año - Sección",
		cell: (info) => {
			const { description, studyYear } = info.getValue();

			return `${studyYear.year} - ${description}`;
		},
	}),
	columnHelper.accessor("student.identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("student.person", {
		header: "Estudiante",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
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

export default function StudentsBySectionIndexRoute() {
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
							data.studyYearId === null &&
							data.studentId === null &&
							data.section === null;

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
						label="Año"
						name="study-year"
						placeholder="Seleccione un año"
						defaultValue={data.studyYearId || ""}
						options={data.studyYears.map(({ id, year }) => ({
							value: id,
							name: year,
						}))}
					/>

					<TextField
						type="search"
						name="section"
						placeholder="ej: A"
						label="Sección"
						defaultValue={data.section || ""}
					/>

					<TextField
						type="search"
						name="student-id"
						placeholder="ej: 28385587"
						label="Cédula de Identidad"
						defaultValue={data.studentId || ""}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.studentsBySection} />
		</div>
	);
}
