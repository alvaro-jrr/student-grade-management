import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { enrollmentSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { getActiveAcademicPeriod } from "~/utils/academic-period.server";
import { apllicableStudyYear } from "~/utils/study-year.server";
import { academicPeriodInterval } from "~/utils";

const mutation = makeDomainFunction(enrollmentSchema)(
	async ({ studentIdentityCard, studyYearId }) => {
		const academicPeriod = await getActiveAcademicPeriod();

		// In case there's no active academic period
		if (!academicPeriod) {
			throw "No hay periodo académico activo para realizar inscripción";
		}

		// Get study year to enroll
		const studyYear = await apllicableStudyYear(studentIdentityCard);

		if (!studyYear) throw "Estudiante no puede ser inscrito";

		// In case study year doesn't match
		if (studyYearId !== studyYear.id) {
			throw `Estudiante solo puede ser inscrito en el Año ${studyYear.year}`;
		}

		// In case student is already enrolled
		const studentEnrollmentExists = await db.enrollment.findUnique({
			where: {
				studentIdentityCard_academicPeriodId_studyYearId: {
					academicPeriodId: academicPeriod.id,
					studentIdentityCard,
					studyYearId,
				},
			},
		});

		if (studentEnrollmentExists) {
			throw "Estudiante ya ha sido inscrito anteriormente";
		}

		return await db.enrollment.create({
			data: {
				academicPeriodId: academicPeriod.id,
				studyYearId,
				studentIdentityCard,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		mutation,
		schema: enrollmentSchema,
		successPath: "/management/enrollments",
	});
};

export const loader = async () => {
	const academicPeriod = await getActiveAcademicPeriod();

	const studyYears = await db.studyYear.findMany({
		select: {
			id: true,
			year: true,
		},
	});

	const students = await db.student.findMany({
		where: {
			enrollments: {
				none: {
					academicPeriodId: academicPeriod?.id,
				},
			},
		},
		select: {
			identityCard: true,
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
		},
	});

	return json({
		academicPeriod: academicPeriod
			? academicPeriodInterval(
					academicPeriod.startDate,
					academicPeriod.endDate
			  )
			: null,
		studyYears,
		students,
	});
};

export default function NewEnrollmentRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear inscripción"
				supportingText="Inscribe a un estudiante a un año del periodo especificado"
			>
				<Form method="post" schema={enrollmentSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									label="Periodo Académico"
									name="academic-period"
									defaultValue={
										data.academicPeriod ||
										"No hay periodo académico activo"
									}
									disabled={true}
								/>

								<Select
									label="Año"
									error={errors.studyYearId?.message}
									options={data.studyYears.map(
										({ id, year }) => ({
											name: year,
											value: id,
										})
									)}
									{...register("studyYearId")}
								/>

								<Select
									label="Estudiante"
									error={errors.studentIdentityCard?.message}
									options={data.students.map(
										({
											identityCard,
											person: { firstname, lastname },
										}) => ({
											name: `${firstname} ${lastname} - C.I: ${identityCard}`,
											value: identityCard,
										})
									)}
									{...register("studentIdentityCard")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/enrollments"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Inscribir</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
