import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import DataNotFound from "~/components/data-not-found";
import { Form } from "~/components/form";
import { RadioGroup, Select, TextField } from "~/components/form-elements";
import { assignmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const editAssignmentSchema = assignmentSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editAssignmentSchema)(
	async ({ id, description, weight }) => {
		// Find assignment
		const assignment = await db.assignment.findUnique({
			where: { id },
			select: {
				academicLoad: {
					select: {
						academicPeriodId: true,
						courseId: true,
					},
				},
				lapseId: true,
			},
		});

		if (!assignment) throw "Asignación no encontrada";

		// Get weights total of that course in that lapse and period
		const weights = await db.assignment.aggregate({
			_sum: {
				weight: true,
			},
			where: {
				academicLoad: {
					academicPeriodId: assignment.academicLoad.academicPeriodId,
					courseId: assignment.academicLoad.courseId,
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
			} como peso, para crear evaluación`;
		}

		return db.assignment.update({
			where: { id },
			data: {
				description,
				weight,
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

	// Get lapses
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
			description: true,
		},
	});

	// Get courses
	const courses = await db.course.findMany({
		select: {
			id: true,
			title: true,
			studyYear: {
				select: {
					year: true,
				},
			},
		},
	});

	const assignment = await db.assignment.findUnique({
		where: { id },
		select: {
			description: true,
			weight: true,
			academicLoad: {
				select: {
					academicPeriodId: true,
					courseId: true,
				},
			},
			lapse: {
				select: {
					id: true,
				},
			},
		},
	});

	return json({
		assignment,
		courses,
		lapses,
	});
};

export default function EditAssignmentRoute() {
	const id = useParams().id;
	const data = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (!data.assignment) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					to="/management/coordinators"
					description={`Evaluación con ID #${id} no ha sido
						encontrado`}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar evaluación"
				supportingText="Modifica la descripción o peso de la evaluación"
			>
				<Form
					method="post"
					schema={assignmentSchema}
					values={{
						courseId: data.assignment.academicLoad.courseId,
						description: data.assignment.description,
						lapseId: data.assignment.lapse.id,
						weight: data.assignment.weight,
					}}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.courseId?.message}
									label="Asignatura"
									options={data.courses.map((course) => ({
										name: `${course.title} - Año ${course.studyYear.year}`,
										value: course.id,
									}))}
									{...register("courseId")}
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
									label="Peso"
									type="number"
									min="1"
									max="100"
									placeholder="ej: 25"
									{...register("weight")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<Button
									type="button"
									variant="secondary"
									onClick={() => navigate(-1)}
								>
									Volver
								</Button>

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
