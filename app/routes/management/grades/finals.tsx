import type { LoaderArgs } from "@remix-run/node";
import type { FinalGrade } from "~/utils/grades.server";
import { json } from "@remix-run/node";
import { getAllFinalGrades } from "~/utils/grades.server";
import { requireUserWithRole } from "~/utils/session.server";
import { AcademicCapIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { TextField } from "~/components/form-elements";
import { createColumnHelper } from "@tanstack/react-table";
import { academicPeriodInterval } from "~/utils";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { Paragraph } from "~/components/typography";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const studentId = url.searchParams.get("student-id");

	// Get student
	const student = await db.student.findUnique({
		where: { identityCard: studentId || "" },
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
		},
	});

	// Final scores
	let finalGrades: FinalGrade[] = [];

	if (studentId) finalGrades = await getAllFinalGrades(studentId);

	return json({ student, studentId, finalGrades });
};

const columnHelper = createColumnHelper<{
	academicPeriod: {
		id: number;
		startDate: string;
		endDate: string;
	};
	studyYear: {
		id: number;
		year: number;
	};
	grade: number;
}>();

// Table columns
const columns = [
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
	columnHelper.accessor("grade", {
		header: "Nota Final",
		cell: (info) => info.getValue(),
	}),
];

export default function FinalGradesRoute() {
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
						const isFirstSearch = data.studentId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						label="Cédula"
						name="student-id"
						type="search"
						placeholder="ej: 123"
						defaultValue={data.studentId || ""}
					/>
				</Form>
			</div>

			<div className="flex flex-row gap-x-4">
				<AcademicCapIcon className="h-6 w-6 text-gray-500" />

				<div className="flex flex-row gap-x-4">
					<Paragraph>
						<span className="font-medium">Estudiante</span>
					</Paragraph>

					<Paragraph>
						{data.student
							? `${data.student.person.firstname} ${data.student.person.lastname}`
							: "No encontrado"}
					</Paragraph>
				</div>
			</div>

			<Table columns={columns} data={data.finalGrades} />
		</div>
	);
}
