import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select } from "~/components/form-elements";
import { courseByStudyYearSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserWithRole } from "~/utils/session.server";

const mutation = makeDomainFunction(courseByStudyYearSchema)(
	async ({ courseId, studyYearId }) => {
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

		return db.courseByStudyYear.create({
			data: {
				courseId,
				studyYearId,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		mutation,
		schema: courseByStudyYearSchema,
		successPath: "/management/course-by-study-year",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	// Get study years and courses
	const studyYears = await db.studyYear.findMany();
	const courses = await db.course.findMany();

	return json({
		studyYears,
		courses,
	});
};

export default function NewCourseByStudyYear() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Asignar asignatura"
				supportingText="Asigna una asignatura a un año"
			>
				<Form schema={courseByStudyYearSchema} method="post">
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
