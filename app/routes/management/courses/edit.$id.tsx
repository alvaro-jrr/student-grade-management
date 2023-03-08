import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { courseSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";

const editCourseSchema = courseSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editCourseSchema)(async ({ id, title }) => {
	const course = await db.course.findFirst({
		where: {
			title,
			id: {
				not: id,
			},
		},
	});

	// In case course exists with that title
	if (course) throw new InputError("Título ya está tomado", "title");

	return db.course.update({
		where: { id },
		data: {
			title,
		},
	});
});

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
		},
	});

	if (!course) {
		throw new Response("Asignatura no ha sido encontrada", {
			status: 404,
		});
	}

	return json({
		course,
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
				<Form
					method="post"
					schema={courseSchema}
					values={{
						title: data.course.title,
					}}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<TextField
								error={errors.title?.message}
								label="Titulo"
								supportingText="Descripción de la asignaura"
								placeholder="ej: Historia Universal"
								{...register("title")}
							/>

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
