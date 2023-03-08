import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form as RemixForm } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { gradeSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getActiveAcademicPeriod } from "~/utils/academic-period.server";
import { academicPeriodInterval } from "~/utils";

const mutation = makeDomainFunction(gradeSchema)(
	async ({ assignmentId, score, studentIdentityCard, note }) => {
		const grade = await db.grade.findUnique({
			where: {
				studentIdentityCard_assignmentId: {
					assignmentId,
					studentIdentityCard,
				},
			},
		});

		// In case there's a score already for this assignment
		if (grade) throw "Estudiante ya tiene una nota asignada";

		return await db.grade.create({
			data: {
				assignmentId,
				studentIdentityCard,
				score,
				note: note || "",
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		mutation,
		schema: gradeSchema,
		successPath: "/management/grades/all",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["TEACHER"]);
	const url = new URL(request.url);

	// Get params
	const studyYearId = url.searchParams.get("study-year");
	const courseId = url.searchParams.get("course-id");

	// Get active period
	const academicPeriod = await getActiveAcademicPeriod();
	const studyYears = await db.studyYear.findMany();

	let academicLoads: {
		courseByStudyYear: {
			course: {
				id: number;
				title: string;
			};
		};
	}[] = [];

	// Search academic loads for that study year
	if (studyYearId) {
		academicLoads = await db.academicLoad.findMany({
			where: {
				teacherIdentityCard: user.identityCard,
				academicPeriodId: academicPeriod?.id,
				courseByStudyYear: {
					studyYearId: Number(studyYearId),
				},
			},
			select: {
				courseByStudyYear: {
					select: {
						course: {
							select: {
								id: true,
								title: true,
							},
						},
					},
				},
			},
		});
	}

	// Get students according to course id
	const students = await db.enrollment.findMany({
		where: {
			academicPeriodId: academicPeriod?.id,
			studyYearId: studyYearId ? Number(studyYearId) : undefined,
		},
		select: {
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
	});

	// Get assignments according to course id
	const assignments = await db.assignment.findMany({
		where: {
			academicLoad: {
				academicPeriodId: academicPeriod?.id,
				AND: {
					courseByStudyYear: {
						courseId: courseId ? Number(courseId) : undefined,
						studyYearId: studyYearId
							? Number(studyYearId)
							: undefined,
					},
				},
			},
		},
		select: {
			id: true,
			description: true,
			lapse: {
				select: {
					description: true,
				},
			},
		},
	});

	return json({
		academicPeriod,
		courseId,
		academicLoads,
		students,
		studyYearId,
		studyYears,
		assignments,
	});
};

export default function NewGradeRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const isAllowed = data.courseId && data.studyYearId;

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar nota"
				supportingText="Asigna la nota de una evaluación a un estudiante"
			>
				<Form
					method="get"
					className="space-y-4"
					onChange={(event) => submit(event.currentTarget)}
				>
					<TextField
						label="Periodo Académico"
						name="academic-period"
						disabled={true}
						defaultValue={
							data.academicPeriod
								? academicPeriodInterval(
										data.academicPeriod.startDate,
										data.academicPeriod.endDate
								  )
								: "No hay periodo académico activo"
						}
					/>

					<Select
						defaultValue={data.studyYearId || ""}
						label="Año"
						name="study-year"
						options={data.studyYears.map(({ id, year }) => ({
							name: year,
							value: id,
						}))}
					/>

					<Select
						defaultValue={data.courseId || ""}
						label="Asignatura"
						name="course-id"
						options={data.academicLoads.map(
							({ courseByStudyYear: { course } }) => ({
								name: course.title,
								value: course.id,
							})
						)}
					/>
				</Form>

				<RemixForm method="post" schema={gradeSchema}>
					{({ register, formState: { errors }, Errors }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.studentIdentityCard?.message}
									disabled={!isAllowed}
									label="Estudiante"
									options={data.students.map(
										({
											student: {
												identityCard,
												person: { firstname, lastname },
											},
										}) => ({
											name: `${firstname} ${lastname} - C.I: ${identityCard}`,
											value: identityCard,
										})
									)}
									{...register("studentIdentityCard")}
								/>

								<Select
									disabled={!isAllowed}
									error={errors.assignmentId?.message}
									label="Evaluación"
									options={data.assignments.map(
										({ id, description, lapse }) => ({
											name: `${description} - Lapso ${lapse.description}`,
											value: id,
										})
									)}
									{...register("assignmentId")}
								/>

								<TextField
									disabled={!isAllowed}
									error={errors.score?.message}
									label="Nota"
									supportingText="La nota debe ser estar entre 1 y 20"
									type="number"
									placeholder="ej: 15"
									{...register("score")}
								/>

								<TextField
									disabled={!isAllowed}
									optional={true}
									label="Observación"
									supportingText="Alguna observación sobre la evaluación de este estudiante"
									error={errors.note?.message}
									placeholder="ej: Tenia una chuleta en el bolso"
									{...register("note")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/grades/all"
								>
									Cancelar
								</ButtonLink>

								<Button disabled={!isAllowed} type="submit">
									Asignar
								</Button>
							</div>
						</>
					)}
				</RemixForm>
			</Card>
		</div>
	);
}
