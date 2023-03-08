import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form as RemixForm } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { academicLoadSchema } from "~/schemas";
import { academicPeriodInterval } from "~/utils";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const editAcademicLoadSchema = academicLoadSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editAcademicLoadSchema)(
	async ({ id, courseByStudyYearId, teacherIdentityCard }) => {
		// Update
		return await db.academicLoad.update({
			where: { id },
			data: {
				courseByStudyYearId,
				teacherIdentityCard,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		schema: academicLoadSchema,
		mutation,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/academic-loads",
	});
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	const id = Number(params.id);

	// Get academic load
	const academicLoad = await db.academicLoad.findUnique({
		where: { id },
		select: {
			academicPeriod: true,
			courseByStudyYear: {
				select: {
					course: true,
					studyYearId: true,
				},
			},
			teacherIdentityCard: true,
		},
	});

	if (!academicLoad) {
		throw new Response("Carga académica no ha sido encontrada", {
			status: 404,
		});
	}

	// Get search params
	const studyYearId =
		url.searchParams.get("study-year") ||
		academicLoad.courseByStudyYear.studyYearId;

	// Get teachers, study years and courses
	const teachers = await db.teacher.findMany({
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
		},
	});

	const studyYears = await db.studyYear.findMany();

	const coursesByStudyYear = await db.courseByStudyYear.findMany({
		where: {
			studyYearId: studyYearId
				? Number(studyYearId)
				: academicLoad.courseByStudyYear.studyYearId,
		},
		select: {
			id: true,
			course: {
				select: {
					title: true,
				},
			},
		},
	});

	return json({
		teachers,
		studyYearId,
		studyYears,
		academicLoad,
		coursesByStudyYear,
	});
};

export default function EditAcademicLoadRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar carga académica"
				supportingText="Editar la carga académica de un docente en un periodo académico"
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
							label="Periodo Académico"
							name="academic-period"
							disabled={true}
							defaultValue={
								data.academicLoad.academicPeriod
									? academicPeriodInterval(
											data.academicLoad.academicPeriod
												.startDate,
											data.academicLoad.academicPeriod
												.endDate
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

				<RemixForm
					method="post"
					schema={academicLoadSchema}
					values={{
						courseByStudyYearId:
							data.academicLoad.courseByStudyYear.course.id,
						teacherIdentityCard:
							data.academicLoad.teacherIdentityCard,
					}}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.courseByStudyYearId?.message}
									label="Asignatura"
									placeholder="Seleccione una asignatura"
									options={data.coursesByStudyYear.map(
										({ course, id }) => ({
											name: course.title,
											value: id,
										})
									)}
									{...register("courseByStudyYearId")}
								/>

								<Select
									error={errors.teacherIdentityCard?.message}
									label="Docente"
									placeholder="Seleccione un docente"
									options={data.teachers.map(
										({
											identityCard,
											person: { firstname, lastname },
										}) => ({
											name: `${firstname} ${lastname}`,
											value: identityCard,
										})
									)}
									{...register("teacherIdentityCard")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/academic-loads"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</RemixForm>
			</Card>
		</div>
	);
}
