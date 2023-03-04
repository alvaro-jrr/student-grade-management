import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { academicPeriodSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { updateAcademicPeriod } from "~/utils/form-validation.server";

const editAcademicPeriodSchema = academicPeriodSchema.extend({
	id: z.preprocess((value: unknown) => Number(value), z.number()),
});

const mutation = makeDomainFunction(editAcademicPeriodSchema)(
	async ({ startDate, endDate, id }) => {
		return await updateAcademicPeriod({ startDate, endDate, id });
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: editAcademicPeriodSchema,
		mutation,
		successPath: "/management/academic-periods",
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const academicPeriodId = Number(params.academicPeriodId);

	const academicPeriod = await db.academicPeriod.findUnique({
		where: { id: academicPeriodId },
		select: { startDate: true, endDate: true, id: true },
	});

	if (!academicPeriod) {
		throw new Response("Periodo académico no ha sido encontrado", {
			status: 404,
		});
	}

	return json({
		academicPeriod: {
			startDate: format(academicPeriod.startDate, "yyyy-MM-dd"),
			endDate: format(academicPeriod.endDate, "yyyy-MM-dd"),
			id: academicPeriod.id,
		},
	});
};

export default function EditAcademicPeriodRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar periodo académico"
				supportingText="Realiza cambios de fecha en el periodo académico requerido"
			>
				<Form
					schema={editAcademicPeriodSchema}
					method="post"
					values={data.academicPeriod}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									error={errors.startDate?.message}
									label="Fecha de Inicio"
									type="date"
									{...register("startDate")}
								/>

								<TextField
									error={errors.endDate?.message}
									type="date"
									label="Fecha de Fin"
									{...register("endDate")}
								/>

								<input {...register("id")} type="hidden" />
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									type="button"
									variant="secondary"
									to="/management/academic-periods"
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
