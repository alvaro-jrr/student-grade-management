import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { studentBySectionSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import {
	findActiveAcademicPeriod,
	getAcademicPeriodRange,
} from "~/utils/utils";

const mutation = makeDomainFunction(studentBySectionSchema)(
	async ({ sectionId, studentIdentityCard }) => {
		const academicPeriod = await findActiveAcademicPeriod();

		if (!academicPeriod) throw "No hay periodo académico activo";

		// Get section
		const section = await db.section.findUnique({
			where: { id: sectionId },
			select: {
				studyYearId: true,
			},
		});

		if (!section) throw "Sección no existe";

		// Get student enrollment
		const enrollment = await db.enrollment.findFirst({
			where: {
				academicPeriodId: academicPeriod.id,
				studentIdentityCard,
			},
			select: {
				studyYear: {
					select: {
						id: true,
						year: true,
					},
				},
			},
		});

		// In case student isn't enrolled
		if (!enrollment) throw "Estudiante no se encuentra inscrito";

		// In case isn't student study year
		if (enrollment.studyYear.id !== section.studyYearId) {
			throw `Estudiante solo puede ser inscrito en una sección del Año ${enrollment.studyYear.year}`;
		}

		const studentSection = await db.section.findFirst({
			where: {
				academicPeriodId: academicPeriod.id,
				students: {
					some: {
						studentIdentityCard,
					},
				},
			},
		});

		// In case student is already in a section
		if (studentSection) throw "Estudiante ya está en una sección";

		return await db.studentBySection.create({
			data: {
				studentIdentityCard,
				sectionId,
			},
		});
	}
);
export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		mutation,
		schema: studentBySectionSchema,
		successPath: "/management/students-by-section",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	// Get active period
	const academicPeriod = await findActiveAcademicPeriod();

	// Get sections
	const sections = await db.section.findMany({
		where: {
			academicPeriodId: academicPeriod?.id,
		},
		select: {
			id: true,
			description: true,
			studyYear: {
				select: {
					year: true,
				},
			},
		},
	});

	// Get students that are enrolled
	const students = await db.student.findMany({
		where: {
			enrollments: {
				some: {
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
			? {
					id: academicPeriod.id,
					range: getAcademicPeriodRange(
						academicPeriod.startDate,
						academicPeriod.endDate
					),
			  }
			: undefined,
		sections: sections || [],
		students: students || [],
	});
};

export default function NewStudentBySectionRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar sección"
				supportingText="Asigna a un estudiante en una sección"
			>
				<Form method="post" schema={studentBySectionSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									name="academic-period"
									label="Periodo Académico"
									disabled={true}
									defaultValue={
										data.academicPeriod?.range ||
										"No hay periodo académico activo"
									}
								/>

								<Select
									label="Año - Sección"
									error={errors.sectionId?.message}
									options={data.sections.map(
										({ id, description, studyYear }) => ({
											name: `${studyYear.year} - ${description}`,
											value: id,
										})
									)}
									{...register("sectionId")}
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
									to="/management/students-by-section"
								>
									Cancelar
								</ButtonLink>

								<Button type="submit">Asignar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
