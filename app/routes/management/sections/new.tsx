import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select, TextField } from "~/components/form-elements";
import { sectionSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { academicPeriodInterval } from "~/utils";

const mutation = makeDomainFunction(sectionSchema)(
	async ({ academicPeriodId, description, studyYearId }) => {
		const sectionExists = await db.section.findFirst({
			where: {
				academicPeriodId,
				description,
				studyYearId,
			},
		});

		// In case there's a section that matches data
		if (sectionExists) {
			throw `Ya existe una sección ${description.toUpperCase()} para el año y periodo seleccionado`;
		}

		return await db.section.create({
			data: {
				academicPeriodId,
				description: description.toUpperCase(),
				studyYearId,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: sectionSchema,
		mutation,
		successPath: "/management/sections",
	});
};

export const loader = async () => {
	const academicPeriods = await db.academicPeriod.findMany({
		select: { id: true, startDate: true, endDate: true },
	});

	const studyYears = await db.studyYear.findMany();

	return json({
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => ({
			id,
			range: academicPeriodInterval(startDate, endDate),
		})),
		studyYears,
	});
};

export default function NewSectionRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear sección"
				supportingText="Una sección se apertura en cada periodo para un año"
			>
				<Form method="post" schema={sectionSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={errors.academicPeriodId?.message}
									label="Periodo Académico"
									placeholder="Seleccione un periodo"
									options={data.academicPeriods.map(
										({ id, range }) => ({
											name: range,
											value: id,
										})
									)}
									{...register("academicPeriodId")}
								/>

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

								<TextField
									error={errors.description?.message}
									label="Sección"
									supportingText="Debe ser una letra que identifique a la sección de ese año"
									placeholder="ej: A"
									{...register("description")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/sections"
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
