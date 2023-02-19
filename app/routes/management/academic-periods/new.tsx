import type { ActionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { formAction } from "~/utils/form-action.server";
import { createAcademicPeriod } from "~/utils/form-validation.server";

const parseDate = (value: unknown) => new Date(String(value));

const schema = z.object({
	startDate: z.preprocess(parseDate, z.date()),
	endDate: z.preprocess(parseDate, z.date()),
});

const mutation = makeDomainFunction(schema)(async ({ startDate, endDate }) => {
	return await createAcademicPeriod({ startDate, endDate });
});

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema,
		mutation,
		successPath: "/management/academic-periods",
	});
};

export default function NewAcademicPeriodRoute() {
	const navigate = useNavigate();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear periodo académico"
				supportingText="Da inicio a un nuevo periodo académico para ingresar nuevas cargas e inscribir estudiantes"
			>
				<Form method="post" schema={schema}>
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
