import { FunnelIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Select } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { getCourseFinalGrade } from "~/utils/grades.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";
import StatCard from "~/components/stat-card";
import { H3 } from "~/components/typography";

type GradeSectionSummary = {
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	score: number;
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const academicPeriodId = url.searchParams.get("academic-period");
	const studyYearId = url.searchParams.get("study-year");
	const sectionId = url.searchParams.get("section");
	const courseId = url.searchParams.get("course");

	// Get periods, study years, courses and sections
	const academicPeriods = await db.academicPeriod.findMany();
	const studyYears = await db.studyYear.findMany();

	const sections = await db.section.findMany({
		where: {
			academicPeriodId: academicPeriodId
				? Number(academicPeriodId)
				: undefined,
			studyYearId: studyYearId ? Number(studyYearId) : undefined,
		},
	});

	const courses = await db.course.findMany({
		where: {
			studyYearId: studyYearId ? Number(studyYearId) : undefined,
		},
	});

	// Get grades
	const students = await db.student.findMany({
		where: {
			sections: {
				some: {
					sectionId: sectionId ? Number(sectionId) : undefined,
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

	const grades: GradeSectionSummary[] = [];

	const courseSummary = {
		studentsApproved: 0,
		studentsReproved: 0,
		studentsCount: students.length,
		gradesAverage: 0,
	};

	if (academicPeriodId && courseId && sectionId && students.length) {
		let gradesTotal = 0;

		for (const student of students) {
			// Get final score
			const finalScore = await getCourseFinalGrade({
				studentIdentityCard: student.identityCard,
				academicPeriodId: Number(academicPeriodId),
				courseId: Number(courseId),
			});

			// Add grade
			gradesTotal += finalScore;

			// Count students approved/reprobed
			finalScore >= 10
				? courseSummary.studentsApproved++
				: courseSummary.studentsReproved++;

			grades.push({
				student,
				score: finalScore,
			});
		}

		courseSummary.gradesAverage = gradesTotal / students.length;
	}

	return json({
		courseSummary,
		academicPeriodId,
		studyYearId,
		sectionId,
		academicPeriods,
		sections,
		courseId,
		studyYears,
		courses,
		grades,
	});
};

const columnHelper = createColumnHelper<GradeSectionSummary>();

// Table columns
const columns = [
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
	columnHelper.accessor("score", {
		header: "Nota Final",
		cell: (info) => info.getValue(),
	}),
];

export default function SectionGradesSummary() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const isSectionSelectable = Boolean(
		data.academicPeriodId && data.studyYearId
	);

	// Get course data

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-center gap-4 lg:flex-row lg:items-center lg:justify-start">
				<FunnelIcon className="h-6 w-6 text-gray-500" />

				<Form
					className="flex flex-col gap-4 lg:flex-row"
					method="get"
					onChange={(event) => {
						const isFirstSearch =
							data.academicPeriodId === null &&
							data.sectionId === null &&
							data.studyYearId;

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
							name: year,
							value: id,
						}))}
					/>

					<Select
						label="Asignatura"
						name="course"
						disabled={data.studyYearId === null}
						placeholder="Seleccione una asignatura"
						defaultValue={data.courseId || ""}
						options={data.courses.map(({ id, title }) => ({
							name: title,
							value: id,
						}))}
					/>

					<Select
						label="Sección"
						name="section"
						disabled={!isSectionSelectable}
						placeholder="Seleccione una sección"
						defaultValue={data.sectionId || ""}
						options={data.sections.map(({ id, description }) => ({
							name: description,
							value: id,
						}))}
					/>
				</Form>
			</div>

			<section className="flex flex-col gap-y-2">
				<H3>Resumen</H3>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<StatCard
						name="Aprobados"
						stat={`${data.courseSummary.studentsApproved} - ${
							(data.courseSummary.studentsApproved * 100) /
							(data.courseSummary.studentsCount || 1)
						} %`}
					/>

					<StatCard
						name="Reprobados"
						stat={`${data.courseSummary.studentsReproved} - ${
							(data.courseSummary.studentsReproved * 100) /
							(data.courseSummary.studentsCount || 1)
						} %`}
					/>

					<StatCard
						name="Promedio General"
						stat={data.courseSummary.gradesAverage}
					/>
				</div>
			</section>

			<Table columns={columns} data={data.grades} />
		</div>
	);
}
