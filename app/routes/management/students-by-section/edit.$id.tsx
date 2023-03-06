import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { studentBySectionSchema as createStudentBySectionSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";

const studentBySectionSchema = createStudentBySectionSchema.pick({
	sectionId: true,
});

const editStudentBySectionSchema = studentBySectionSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editStudentBySectionSchema)(
	async ({ id, sectionId }) => {
		return await db.studentBySection.update({
			where: { id },
			data: {
				sectionId,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		mutation,
		schema: studentBySectionSchema,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/students-by-section",
	});
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const id = Number(params.id);

	// Get student by section
	const studentBySection = await db.studentBySection.findUnique({
		where: { id },
		select: {
			section: {
				select: {
					id: true,
					academicPeriod: {
						select: {
							id: true,
							startDate: true,
							endDate: true,
						},
					},
					studyYear: {
						select: {
							id: true,
							year: true,
						},
					},
					description: true,
				},
			},
			student: {
				select: {
					identityCard: true,
					person: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
				},
			},
		},
	});

	if (!studentBySection) {
		throw new Response("Estudiante por sección no encontrado", {
			status: 404,
		});
	}

	const academicPeriod = studentBySection.section.academicPeriod;

	// Get sections
	const sections = await db.section.findMany({
		where: {
			academicPeriodId: academicPeriod.id,
			studyYearId: studentBySection.section.studyYear.id,
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

	return json({
		academicPeriod,
		sections: sections || [],
		studentBySection,
	});
};

export default function EditStudentBySection() {
	const data = useLoaderData<typeof loader>();
	const student = data.studentBySection.student;

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar asignación"
				supportingText="Actualiza la sección de un estudiante"
			>
				<Form
					schema={studentBySectionSchema}
					method="post"
					values={{
						sectionId: data.studentBySection.section.id,
					}}
				>
					{({ register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									label="Periodo Académico"
									disabled={true}
									name="academic-period"
									defaultValue={academicPeriodInterval(
										data.academicPeriod.startDate,
										data.academicPeriod.endDate
									)}
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

								<TextField
									label="Estudiante"
									disabled={true}
									name="student"
									defaultValue={`${student.person.firstname} ${student.person.lastname} - C.I: ${student.identityCard}`}
								/>
							</div>

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/students-by-section"
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
