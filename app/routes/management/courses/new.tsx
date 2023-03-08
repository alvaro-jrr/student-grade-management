import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { courseSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { requireUserId } from "~/utils/session.server";

const mutation = makeDomainFunction(courseSchema)(async ({ title }) => {
	const course = await db.course.findUnique({
		where: {
			title,
		},
	});

	// In case course exists with that title
	if (course) throw new InputError("Título ya está tomado", "title");

	return await db.course.create({
		data: {
			title,
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

	return null;
};

export default function NewCourseRoute() {
	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear asignatura"
				supportingText="Agrega una asignatura a un año de estudio particular"
			>
				<Form method="post" schema={courseSchema}>
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

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
