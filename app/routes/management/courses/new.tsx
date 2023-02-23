import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { courseSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserId } from "~/utils/session.server";

const mutation = makeDomainFunction(courseSchema)(async ({ title, year }) => {
	return await db.course.create({
		data: {
			title,
			studyYearId: year,
		},
	});
});

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: courseSchema,
		mutation,
		successPath: "/management/courses",
	});
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	return json({
		years: await db.studyYear.findMany({
			select: { id: true, year: true },
		}),
	});
};

export default function NewCourseRoute() {
	const data = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear asignatura"
				supportingText="Agrega una asignatura a un año de estudio particular"
			>
				<Form method="post" schema={courseSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									label="Año"
									error={errors.year?.message}
									supportingText="Año de estudio en el que será impartida la asignatura"
									placeholder="Seleccione un año"
									options={data.years.map(({ year, id }) => {
										return {
											name: year,
											value: id,
										};
									})}
									{...register("year")}
								/>

								<TextField
									error={errors.title?.message}
									label="Titulo"
									supportingText="Descripción de la asignaura"
									placeholder="ej: Historia Universal"
									{...register("title")}
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

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
