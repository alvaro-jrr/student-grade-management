import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { RadioGroup, TextField } from "~/components/form-elements";
import { assignmentSchema as newAssignmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const assignmentSchema = newAssignmentSchema.omit({
	courseByStudyYearId: true,
});

const editAssignmentSchema = assignmentSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editAssignmentSchema)(
	async ({ id, description, weight, lapseId }) => {
		// Find assignment
		const assignment = await db.assignment.findUnique({
			where: { id },
			select: {
				academicLoad: {
					select: {
						academicPeriodId: true,
						courseByStudyYearId: true,
					},
				},
				lapseId: true,
			},
		});

		if (!assignment) throw "Asignación no encontrada";

		// Get academic load
		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId: assignment.academicLoad.academicPeriodId,
				courseByStudyYearId:
					assignment.academicLoad.courseByStudyYearId,
			},
		});

		if (!academicLoad) {
			throw "No existe carga académica para la asignatura seleccionada";
		}

		// Get weights total of that course in that lapse and period
		const weights = await db.assignment.aggregate({
			_sum: {
				weight: true,
			},
			where: {
				academicLoad: {
					academicPeriodId: assignment.academicLoad.academicPeriodId,
					courseByStudyYearId:
						assignment.academicLoad.courseByStudyYearId,
				},
				lapseId: assignment.lapseId,
				id: {
					not: id,
				},
			},
		});

		const weightsTotal = weights._sum.weight || 0;

		// In case weight can't be assigned
		if (weightsTotal + weight > 100) {
			throw `Debe asignar como máximo ${
				100 - weightsTotal
			} como ponderación, para crear evaluación`;
		}

		return db.assignment.update({
			where: { id },
			data: {
				description,
				weight,
				lapseId,
				academicLoadId: academicLoad.id,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		schema: assignmentSchema,
		mutation,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/assignments",
	});
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const id = Number(params.id);

	// Get assignment
	const assignment = await db.assignment.findUnique({
		where: { id },
		select: {
			description: true,
			weight: true,
			academicLoad: {
				select: {
					academicPeriod: true,
					courseByStudyYear: {
						select: {
							id: true,
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
			lapse: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!assignment) {
		throw new Response("Evaluación no ha sido encontrada", {
			status: 404,
		});
	}

	// Get lapses and study years
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
			description: true,
		},
	});

	return json({
		assignment,
		lapses,
	});
};

export default function EditAssignmentRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar evaluación"
				supportingText="Modifica la descripción o ponderación de la evaluación"
			>
				<Form
					method="post"
					schema={assignmentSchema}
					values={{
						description: data.assignment.description,
						lapseId: data.assignment.lapse.id,
						weight: data.assignment.weight,
					}}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									label="Asignatura"
									name="course"
									disabled={true}
									defaultValue={
										data.assignment.academicLoad
											.courseByStudyYear.course.title
									}
								/>

								<RadioGroup
									error={errors.lapseId?.message}
									label="Lapso"
									options={data.lapses.map((lapse) => ({
										name: lapse.description,
										value: lapse.id,
									}))}
									{...register("lapseId")}
								/>

								<TextField
									error={errors.description?.message}
									label="Descripción"
									placeholder="ej: Quiz de Tabla Periodica"
									{...register("description")}
								/>

								<TextField
									error={errors.weight?.message}
									label="Ponderación"
									type="number"
									min="1"
									max="100"
									placeholder="ej: 25"
									{...register("weight")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/assignments"
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
