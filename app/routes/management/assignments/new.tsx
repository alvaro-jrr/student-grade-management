import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { getYear } from "date-fns";
import { makeDomainFunction } from "domain-functions";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { RadioGroup, Select, TextField } from "~/components/form-elements";
import { assignmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const mutation = makeDomainFunction(assignmentSchema)(
	async ({ academicPeriodId, courseId, lapseId, description, weight }) => {
		// Get all assignments from that period-course-lapse
		const assignments = await db.assignment.findMany({
			where: {
				academicLoad: {
					academicPeriodId,
					courseId,
				},
				lapseId,
			},
			select: {
				weight: true,
			},
		});

		// Sum all weights
		const totalWeights = assignments.reduce(
			(previous, current) => previous + current.weight,
			0
		);

		// In case it's complete
		if (totalWeights === 100)
			throw "No se puede crear evaluación, las evaluaciones de la asignatura completan el peso del lapso";

		// In case weight can't be assigned
		if (totalWeights + weight > 100) {
			throw `Debe asignar como máximo ${
				100 - totalWeights
			} como peso, para crear evaluación`;
		}

		// Get academic load
		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId,
				courseId,
			},
		});

		if (academicLoad === null)
			throw "No existe carga académica para la asignatura seleccionada";

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

	// Get periods
	const academicPeriods = await db.academicPeriod.findMany({
		select: {
			id: true,
			startDate: true,
			endDate: true,
		},
	});

	// Get lapses
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
			description: true,
		},
	});

	// Get only courses given by the teacher
	const courses = await db.course.findMany({
		where: {
			academicLoads: {
				every: {
					teacherIdentityCard: user.identityCard,
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
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => ({
			id,
			range: `${getYear(startDate)}-${getYear(endDate)}`,
		})),
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
				supportingText="Asigna una evaluación a los estudiantes de la asignatura"
			>
				<Form schema={assignmentSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.academicPeriodId?.message}
									label="Periodo Académico"
									options={data.academicPeriods.map(
										(academicPeriod) => ({
											name: academicPeriod.range,
											value: academicPeriod.id,
										})
									)}
									{...register("academicPeriodId")}
								/>

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
