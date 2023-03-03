import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import DataNotFound from "~/components/data-not-found";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { academicPeriodSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { updateAcademicPeriod } from "~/utils/form-validation.server";
import { dateFormat } from "~/utils/utils";

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

	return json({
		academicPeriod: academicPeriod
			? {
					startDate: dateFormat(academicPeriod.startDate),
					endDate: dateFormat(academicPeriod.endDate),
					id: academicPeriod.id,
			  }
			: null,
	});
};

export default function EditAcademicPeriodRoute() {
	const data = useLoaderData<typeof loader>();
	const academicPeriodId = Number(useParams().academicPeriodId);
	const navigate = useNavigate();

	if (!data.academicPeriod) {
		return (
			<div className="flex h-full items-center justify-center">
				<DataNotFound
					description={`Periodo académico con ID #${academicPeriodId} no ha sido
						encontrado`}
					to="/management/academic-periods"
				/>
			</div>
		);
	}

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
								<Button
									type="button"
									variant="secondary"
									onClick={() => navigate(-1)}
								>
									Volver
								</Button>

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
