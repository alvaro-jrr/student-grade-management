import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form as RemixForm } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { academicLoadSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { academicPeriodInterval } from "~/utils";
import { getActiveAcademicPeriod } from "~/utils/academic-period.server";
import { requireUserWithRole } from "~/utils/session.server";

const mutation = makeDomainFunction(academicLoadSchema)(
	async ({ courseByStudyYearId, teacherIdentityCard }) => {
		const academicPeriod = await getActiveAcademicPeriod();

		// In case there's no active period
		if (!academicPeriod) throw "No hay periodo académico activo";

		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId: academicPeriod.id,
				courseByStudyYearId,
			},
			select: { id: true, teacherIdentityCard: true },
		});

		// In case academic load is already assigned
		if (academicLoad) {
			throw "La asignatura ya tiene un docente asignado en el periodo actual";
		}

		return await db.academicLoad.create({
			data: {
				academicPeriodId: academicPeriod.id,
				courseByStudyYearId,
				teacherIdentityCard,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: academicLoadSchema,
		mutation,
		successPath: "/management/academic-loads",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const studyYearId = url.searchParams.get("study-year");

	// Get academic period and courses for that study year
	const academicPeriod = await getActiveAcademicPeriod();

	let coursesByStudyYear: {
		id: number;
		course: {
			title: string;
		};
	}[] = [];

	if (studyYearId) {
		coursesByStudyYear = await db.courseByStudyYear.findMany({
			where: {
				studyYearId: Number(studyYearId),
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
	}

	const studyYears = await db.studyYear.findMany();

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

	return json({
		academicPeriod,
		studyYears,
		teachers,
		coursesByStudyYear,
		studyYearId,
	});
};

export default function NewAcademicLoadRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar carga académica"
				supportingText="Asigna a un docente una asignatura en un periodo académico"
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

				<RemixForm method="post" schema={academicLoadSchema}>
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
									to="/management/academic-loads"
									variant="secondary"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Asignar</Button>
							</div>
						</>
					)}
				</RemixForm>
			</Card>
		</div>
	);
}
