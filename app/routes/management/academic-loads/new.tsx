import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select } from "~/components/form-elements";
import { academicLoadSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { getAcademicPeriodRange } from "~/utils/utils";

const mutation = makeDomainFunction(academicLoadSchema)(
	async ({ academicPeriodId, courseId, teacherIdentityCard }) => {
		const academicLoad = await db.academicLoad.findFirst({
			where: {
				academicPeriodId,
				courseId,
			},
			select: { id: true, teacherIdentityCard: true },
		});

		const data = {
			academicPeriodId,
			courseId,
			teacherIdentityCard,
		};

		// Create
		if (!academicLoad) return await db.academicLoad.create({ data });

		throw "La asignatura ya tiene un docente asignado en el periodo actual";
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

export const loader = async () => {
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

	return json({
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => ({
			id,
			range: getAcademicPeriodRange(startDate, endDate),
		})),
		teachers: teachers.map(
			({ person: { firstname, lastname }, identityCard }) => ({
				name: `${firstname} ${lastname} - C.I: ${identityCard}`,
				identityCard,
			})
		),
		courses,
	});
};

export default function NewAcademicLoadRoute() {
	const data = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar carga académica"
				supportingText="Asigna a un docente una asignatura en un periodo académico"
			>
				<Form method="post" schema={academicLoadSchema}>
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
								<Button
									type="button"
									variant="secondary"
									onClick={() => navigate(-1)}
								>
									Volver
								</Button>

								<Button type="submit">Asignar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
