import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { getYear } from "date-fns";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import DataNotFound from "~/components/data-not-found";
import { Form } from "~/components/form";
import { Select } from "~/components/form-elements";
import { academicLoadSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";

const editAcademicLoadSchema = academicLoadSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editAcademicLoadSchema)(
	async ({ academicPeriodId, courseId, teacherIdentityCard, id }) => {
		// Update
		return await db.academicLoad.update({
			where: { id },
			data: {
				academicPeriodId,
				courseId,
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

export const loader = async ({ params }: LoaderArgs) => {
	const id = Number(params.id);

	const academicPeriods = await db.academicPeriod.findMany({
		select: { id: true, startDate: true, endDate: true },
	});

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

	const courses = await db.course.findMany({
		select: { id: true, title: true },
	});

	const academicLoad = await db.academicLoad.findUnique({
		where: { id },
		select: {
			academicPeriodId: true,
			courseId: true,
			teacherIdentityCard: true,
		},
	});

	return json({
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => ({
			id,
			range: `${getYear(startDate)}-${getYear(endDate)}`,
		})),
		teachers: teachers.map(
			({ person: { firstname, lastname }, identityCard }) => ({
				name: `${firstname} ${lastname} - CI: ${identityCard}`,
				identityCard,
			})
		),
		courses,
		academicLoad,
	});
};

export default function EditAcademicLoadRoute() {
	const id = useParams().id;
	const data = useLoaderData<typeof loader>();

	if (!data.academicLoad) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					description={`Carga Académica con ID #${id} no ha sido
						encontrado`}
					to="/management/academic-loads"
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar carga académica"
				supportingText="Editar la carga académica de un docente en un periodo académico"
			>
				<Form
					method="post"
					schema={academicLoadSchema}
					values={data.academicLoad}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.academicPeriodId?.message}
									label="Periodo Académico"
									placeholder="Seleccione un periodo"
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
									placeholder="Seleccione una asignatura"
									options={data.courses.map((course) => ({
										name: course.title,
										value: course.id,
									}))}
									{...register("courseId")}
								/>

								<Select
									error={errors.teacherIdentityCard?.message}
									label="Docente"
									placeholder="Seleccione un docente"
									options={data.teachers.map((teacher) => ({
										name: teacher.name,
										value: teacher.identityCard,
									}))}
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
				</Form>
			</Card>
		</div>
	);
}
