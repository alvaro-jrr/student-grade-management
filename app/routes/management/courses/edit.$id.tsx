import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { courseSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";

const editCourseSchema = courseSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editCourseSchema)(
	async ({ id, title, year }) => {
		return db.course.update({
			where: { id },
			data: {
				title,
				studyYearId: year,
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id || "");

	return formAction({
		request,
		schema: courseSchema,
		mutation,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/courses",
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const id = Number(params.id || "");

	const course = await db.course.findUnique({
		where: { id },
		select: {
			title: true,
			studyYearId: true,
		},
	});

	if (!course) {
		throw new Response("Asignatura no ha sido encontrada", {
			status: 404,
		});
	}

	return json({
		course: {
			title: course.title,
			year: course.studyYearId,
		},
		years: await db.studyYear.findMany({
			select: { id: true, year: true },
		}),
	});
};

export default function EditCourseRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar asignatura"
				supportingText="Modifica los datos de una asignatura"
			>
				<Form method="post" schema={courseSchema} values={data.course}>
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
								<ButtonLink
									variant="secondary"
									to="/management/courses"
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
