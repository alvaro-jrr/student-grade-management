import type { LoaderArgs } from "@remix-run/node";
import type { StudyYearGrade } from "~/utils/grades.server";
import { getStudyYearGrades } from "~/utils/grades.server";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { Select, TextField } from "~/components/form-elements";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, [
		"COORDINATOR",
		"REPRESENTATIVE",
	]);

	const url = new URL(request.url);

	// Get search params
	const studentId = url.searchParams.get("student");
	const studyYearId = url.searchParams.get("study-year");

	// Get student and study years
	const student = await db.student.findFirst({
		where: {
			identityCard: studentId || "",
			representatives: {
				some: {
					representativeIdentityCard:
						user.role === "REPRESENTATIVE"
							? user.identityCard
							: undefined,
				},
			},
		},
		select: {
			identityCard: true,
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
		},
	});

	const studyYears = await db.studyYear.findMany();
	const grades: StudyYearGrade[] = [];

	if (student && studyYearId) {
		// Get enrollments
		const enrollment = await db.enrollment.findFirst({
			where: {
				studentIdentityCard: student.identityCard,
				studyYearId: Number(studyYearId),
			},
			select: {
				academicPeriodId: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (enrollment) {
			const studyYearGrades = await getStudyYearGrades({
				academicPeriodId: enrollment.academicPeriodId,
				studentIdentityCard: student.identityCard,
				studyYearId: Number(studyYearId),
			});

			grades.push(...studyYearGrades);
		}
	}

	return json({
		studentId,
		studyYearId,
		student,
		studyYears,
		grades,
	});
};

const columnHelper = createColumnHelper<StudyYearGrade>();

// Table columns
const columns = [
	columnHelper.accessor("course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.group({
		header: "Lapso",
		columns: [
			columnHelper.accessor("lapse.first", {
				header: "1",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("lapse.second", {
				header: "2",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("lapse.third", {
				header: "3",
				cell: (info) => info.getValue(),
			}),
		],
	}),
];

export default function StudentsBulletin() {
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
							data.studentId === null &&
							data.studyYearId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						label="Cédula"
						name="student"
						type="search"
						placeholder="ej: 123"
						defaultValue={data.studentId || ""}
					/>

					<Select
						label="Año"
						name="study-year"
						placeholder="Seleccione un año"
						defaultValue={data.studyYearId || ""}
						options={data.studyYears.map(({ id, year }) => ({
							name: year,
							value: id,
						}))}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.grades} />
		</div>
	);
}
