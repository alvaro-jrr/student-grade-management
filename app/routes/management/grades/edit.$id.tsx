import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { gradeSchema as createGradeSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";

const gradeSchema = createGradeSchema.pick({
	note: true,
	score: true,
});

const editGradeSchema = gradeSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editGradeSchema)(
	async ({ id, score, note }) => {
		return await db.grade.update({
			where: { id },
			data: {
				score,
				note,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		mutation,
		schema: gradeSchema,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/grades",
	});
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const id = Number(params.id);

	// Get grade
	const grade = await db.grade.findUnique({
		where: { id },
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
			note: true,
			score: true,
			assignment: {
				select: {
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
					description: true,
					weight: true,
					lapse: {
						select: {
							description: true,
						},
					},
				},
			},
		},
	});

	if (!grade) {
		throw new Response("Nota no encontrada", {
			status: 404,
		});
	}

	return json({
		grade,
	});
};

export default function EditGradeRoute() {
	const data = useLoaderData<typeof loader>();

	// Extract values
	const academicPeriod = data.grade.assignment.academicLoad.academicPeriod;
	const course = data.grade.assignment.academicLoad.course;
	const student = data.grade.student;
	const assignment = data.grade.assignment;

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar nota"
				supportingText="Actualiza la nota de una evaluación de un estudiante"
			>
				<Form
					method="post"
					schema={gradeSchema}
					values={{
						note: data.grade.note,
						score: data.grade.score,
					}}
				>
					{({ register, formState: { errors }, Errors }) => (
						<>
							<div className="space-y-4">
								<TextField
									label="Periodo Académico"
									name="academic-period"
									disabled={true}
									defaultValue={academicPeriodInterval(
										academicPeriod.startDate,
										academicPeriod.endDate
									)}
								/>

								<TextField
									defaultValue={`${course.title} - Año ${course.studyYear.year}`}
									label="Asignatura"
									disabled={true}
									name="course"
								/>

								<TextField
									label="Estudiante"
									name="student"
									disabled={true}
									defaultValue={`${student.person.firstname} ${student.person.lastname} - C.I: ${student.identityCard}`}
								/>

								<TextField
									label="Evaluación"
									name="assignment"
									disabled={true}
									defaultValue={`${assignment.description} - Lapso ${assignment.lapse.description}`}
								/>

								<TextField
									error={errors.score?.message}
									label="Nota"
									supportingText="La nota debe ser estar entre 1 y 20"
									type="number"
									placeholder="ej: 15"
									{...register("score")}
								/>

								<TextField
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
									to="/management/grades"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
