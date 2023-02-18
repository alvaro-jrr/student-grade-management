import type { ActionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";

const parseDate = (value: unknown) => new Date(String(value));

const schema = z.object({
	startDate: z.preprocess(parseDate, z.date()),
	endDate: z.preprocess(parseDate, z.date()),
});

const mutation = makeDomainFunction(schema)(async ({ startDate, endDate }) => {
	// In case endDate is before startDate
	if (Number(endDate) - Number(startDate) <= 0) {
		throw "La fecha de fin del periodo debe ser después de la fecha de inicio";
	}

	const startYear = startDate.getFullYear();
	const endYear = endDate.getFullYear();

	// In case there's more than 1 year of difference
	if (endYear - startYear !== 1) {
		throw "La fecha de fin debe ocurrir en el año siguiente a la fecha de inicio";
	}

	const academicPerids = await db.academicPeriod.findMany({
		select: { endDate: true },
	});

	// In case there's an active period
	const isActive = academicPerids.some((academicPeriod) => {
		const currentDate = new Date();

		return Number(academicPeriod.endDate) - Number(currentDate);
	});

	if (isActive) throw "Actualmente hay un periodo académico activo";

	const academicPeriod = await db.academicPeriod.create({
		data: {
			startDate,
			endDate,
		},
	});

	return academicPeriod;
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
		<div className="flex items-center justify-center h-full">
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
									Cancelar
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
