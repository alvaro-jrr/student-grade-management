import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { Paragraph } from "~/components/typography";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { updateAcademicPeriod } from "~/utils/form-validation.server";

const parseDate = (value: unknown) => new Date(String(value));

const schema = z.object({
	id: z.preprocess((value: unknown) => Number(value), z.number()),
	startDate: z.preprocess(parseDate, z.date()),
	endDate: z.preprocess(parseDate, z.date()),
});

const mutation = makeDomainFunction(schema)(
	async ({ startDate, endDate, id }) => {
		return await updateAcademicPeriod({ startDate, endDate, id });
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema,
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
					startDate: format(academicPeriod.startDate, "yyyy-MM-dd"),
					endDate: format(academicPeriod.endDate, "yyyy-MM-dd"),
					id: academicPeriod.id,
			  }
			: null,
	});
};

export default function EditAcademicPeriodRoute() {
	const { academicPeriod } = useLoaderData<typeof loader>();
	const academicPeriodId = Number(useParams().academicPeriodId);
	const navigate = useNavigate();

	if (!academicPeriod) {
		return (
			<div className="flex h-full items-center justify-center">
				<Card title="Periodo académico no encontrado">
					<Paragraph>
						Periodo académico con ID #{academicPeriodId} no ha sido
						encontrado
					</Paragraph>

					<div className="flex justify-end">
						<ButtonLink
							to="/management/academic-periods"
							variant="secondary"
						>
							Volver
						</ButtonLink>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar periodo académico"
				supportingText="Realiza cambios de fecha en el periodo académico requerido"
			>
				<Form schema={schema} method="post" values={academicPeriod}>
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
