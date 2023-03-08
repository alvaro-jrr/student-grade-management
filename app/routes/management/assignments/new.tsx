import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form as RemixForm } from "~/components/form";
import { RadioGroup, Select, TextField } from "~/components/form-elements";
import { assignmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getActiveAcademicPeriod } from "~/utils/academic-period.server";
import { academicPeriodInterval } from "~/utils";

const mutation = makeDomainFunction(assignmentSchema)(
	async ({ courseByStudyYearId, lapseId, description, weight }) => {
		// Find active academic period
		const activeAcademicPeriod = await getActiveAcademicPeriod();

		if (!activeAcademicPeriod) {
			throw "No se pueden asignar evaluaciones si no hay un periodo académico activo";
		}

		// Get academic load
		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId: activeAcademicPeriod.id,
				courseByStudyYearId,
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
					academicPeriodId: activeAcademicPeriod.id,
					courseByStudyYearId,
				},
				lapseId,
			},
		});

		const weightsTotal = weights._sum.weight || 0;

		// In case it's complete
		if (weightsTotal === 100)
			throw "No se puede crear evaluación, las evaluaciones de la asignatura completan el ponderación del lapso";

		// In case weight can't be assigned
		if (weightsTotal + weight > 100) {
			throw `Debe asignar como máximo ${
				100 - weightsTotal
			} como ponderación, para crear evaluación`;
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
	const url = new URL(request.url);

	// Get search params
	const studyYearId = url.searchParams.get("study-year");

	// Get active academic period
	const academicPeriod = await getActiveAcademicPeriod();

	// Get lapses and study years
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
			description: true,
		},
	});

	const studyYears = await db.studyYear.findMany();

	// Get only courses given by the teacher in current academic period
	const courses = await db.academicLoad.findMany({
		where: {
			teacherIdentityCard: user.identityCard,
			academicPeriodId: academicPeriod?.id,
			AND: {
				courseByStudyYear: {
					studyYearId: studyYearId ? Number(studyYearId) : undefined,
				},
			},
		},
		select: {
			courseByStudyYear: {
				select: {
					id: true,
					course: {
						select: {
							title: true,
						},
					},
				},
			},
		},
	});

	return json({
		studyYearId,
		studyYears,
		academicPeriod,
		courses,
		lapses,
	});
};

export default function NewAssignmentRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear evaluación"
				supportingText="Asigna una evaluación a los estudiantes de la asignatura en el periodo activo"
			>
				<Form
					method="get"
					onChange={(event) => {
						const isFirstSearch = data.studyYearId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<div className="space-y-4">
						<TextField
							disabled={true}
							label="Periodo Académico"
							name="academic-period"
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
							label="Año"
							name="study-year"
							defaultValue={data.studyYearId || ""}
							options={data.studyYears.map(({ id, year }) => ({
								name: year,
								value: id,
							}))}
						/>
					</div>
				</Form>

				<RemixForm method="post" schema={assignmentSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.courseByStudyYearId?.message}
									label="Asignatura"
									options={data.courses.map(
										({
											courseByStudyYear: { course, id },
										}) => ({
											name: course.title,
											value: id,
										})
									)}
									{...register("courseByStudyYearId")}
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

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</RemixForm>
			</Card>
		</div>
	);
}
