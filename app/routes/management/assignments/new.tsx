import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { RadioGroup, Select, TextField } from "~/components/form-elements";
import { assignmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import { findActiveAcademicPeriod } from "~/utils/utils";

const mutation = makeDomainFunction(assignmentSchema)(
	async ({ courseId, lapseId, description, weight }) => {
		// Find active academic period
		const activeAcademicPeriod = await findActiveAcademicPeriod();

		if (!activeAcademicPeriod)
			throw "No se pueden asignar evaluaciones si no hay un periodo académico activo";

		// Get academic load
		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId: activeAcademicPeriod.id,
				courseId,
			},
		});

		if (academicLoad === null)
			throw "No existe carga académica para la asignatura seleccionada";

		// Get weights total of that course in that lapse and period
		const weights = await db.assignment.aggregate({
			_sum: {
				weight: true,
			},
			where: {
				academicLoad: {
					academicPeriodId: activeAcademicPeriod.id,
					courseId,
				},
				lapseId,
			},
		});

		const weightsTotal = weights._sum.weight || 0;

		// In case it's complete
		if (weightsTotal === 100)
			throw "No se puede crear evaluación, las evaluaciones de la asignatura completan el peso del lapso";

		// In case weight can't be assigned
		if (weightsTotal + weight > 100) {
			throw `Debe asignar como máximo ${
				100 - weightsTotal
			} como peso, para crear evaluación`;
		}

		return db.assignment.create({
			data: {
				description,
				weight,
				lapseId,
				academicLoadId: academicLoad.id,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: assignmentSchema,
		mutation,
		successPath: "/management/assignments",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["TEACHER"]);

	// Get active academic period
	const activeAcademicPeriod = await findActiveAcademicPeriod();

	// Get lapses
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
			description: true,
		},
	});

	// Get only courses given by the teacher in current academic period
	const courses = await db.course.findMany({
		where: {
			academicLoads: {
				every: {
					teacherIdentityCard: user.identityCard,
					academicPeriodId:
						activeAcademicPeriod && activeAcademicPeriod.id,
				},
			},
		},
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

	return json({
		courses,
		lapses,
	});
};

export default function NewAssignmentRoute() {
	const data = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear evaluación"
				supportingText="Asigna una evaluación a los estudiantes de la asignatura en el periodo activo"
			>
				<Form schema={assignmentSchema}>
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

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
