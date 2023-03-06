import { FunnelIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { Select, TextField } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const academicPeriodId = url.searchParams.get("academic-period");
	const studyYearId = url.searchParams.get("study-year");
	const studentId = url.searchParams.get("student-id");

	// Get periods and study years
	const academicPeriods = await db.academicPeriod.findMany();
	const studyYears = await db.studyYear.findMany();

	const enrollments = await db.enrollment.findMany({
		where: {
			academicPeriodId: academicPeriodId
				? Number(academicPeriodId)
				: undefined,
			studyYearId: studyYearId ? Number(studyYearId) : undefined,
			studentIdentityCard: {
				startsWith: studentId || undefined,
			},
		},
		select: {
			id: true,
			createdAt: true,
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
		studentId,
		academicPeriodId,
		studyYearId,
		academicPeriods,
		studyYears,
		enrollments,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	createdAt: string;
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	studyYear: {
		year: number;
	};
	academicPeriod: {
		startDate: string;
		endDate: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("createdAt", {
		header: "Fecha",
		cell: (info) => format(new Date(info.getValue()), "dd/MM/yyyy"),
	}),
	columnHelper.accessor("academicPeriod", {
		header: "Periodo",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return academicPeriodInterval(startDate, endDate);
		},
	}),
	columnHelper.accessor("studyYear.year", {
		header: "Año",
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
];

export default function EnrollmentsIndexRoute() {
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
							data.studentId === null;

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
								name: academicPeriodInterval(
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
						name="student-id"
						placeholder="ej: 28385587"
						label="Cédula de Identidad"
						defaultValue={data.studentId || ""}
					/>
				</Form>
			</div>
			<Table columns={columns} data={data.enrollments} />
		</div>
	);
}
