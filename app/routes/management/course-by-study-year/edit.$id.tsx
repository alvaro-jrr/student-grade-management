import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select } from "~/components/form-elements";
import { courseByStudyYearSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const editCourseByStudyYearSchema = courseByStudyYearSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editCourseByStudyYearSchema)(
	async ({ id, courseId, studyYearId }) => {
		const courseByStudyYear = await db.courseByStudyYear.findUnique({
			where: {
				studyYearId_courseId: {
					courseId,
					studyYearId,
				},
			},
		});

		// In case is already registerd
		if (courseByStudyYear) throw "Asignatura ya está asignada al año";

		return db.courseByStudyYear.update({
			where: { id },
			data: {
				courseId,
				studyYearId,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		mutation,
		schema: courseByStudyYearSchema,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/course-by-study-year",
	});
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const id = Number(params.id);

	// Get course by study year
	const courseByStudyYear = await db.courseByStudyYear.findUnique({
		where: { id },
	});

	// In case isn't found
	if (!courseByStudyYear) {
		throw new Response("Asignatura por Año no encontrado", {
			status: 404,
		});
	}

	// Get study years and courses
	const studyYears = await db.studyYear.findMany();
	const courses = await db.course.findMany();

	return json({
		courseByStudyYear,
		studyYears,
		courses,
	});
};

export default function EditCourseByStudyYear() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar asignatura"
				supportingText="Asigna una asignatura a un año"
			>
				<Form
					schema={courseByStudyYearSchema}
					method="post"
					values={{
						courseId: data.courseByStudyYear.courseId,
						studyYearId: data.courseByStudyYear.studyYearId,
					}}
				>
					{({ register, formState: { errors }, Errors }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.studyYearId?.message}
									label="Año"
									placeholder="Seleccione un año"
									options={data.studyYears.map(
										({ id, year }) => ({
											name: year,
											value: id,
										})
									)}
									{...register("studyYearId")}
								/>

								<Select
									error={errors.courseId?.message}
									label="Asignatura"
									placeholder="Seleccione una asignatura"
									options={data.courses.map(
										({ id, title }) => ({
											name: title,
											value: id,
										})
									)}
									{...register("courseId")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/course-by-study-year"
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
