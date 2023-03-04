import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { TextField } from "~/components/form-elements";
import { sectionSchema as newSectionSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { getAcademicPeriodRange } from "~/utils/utils";

const sectionSchema = newSectionSchema.pick({
	description: true,
});

const editSectionSchema = sectionSchema.extend({
	id: z.number(),
});

const mutation = makeDomainFunction(editSectionSchema)(
	async ({ id, description }) => {
		// Get section
		const section = await db.section.findUnique({
			where: { id },
			select: {
				academicPeriodId: true,
				studyYearId: true,
			},
		});

		if (!section) throw "No existe la sección por actualizar";

		const sectionExists = await db.section.findFirst({
			where: {
				academicPeriodId: section.academicPeriodId,
				description,
				studyYearId: section.studyYearId,
				id: {
					not: id,
				},
			},
		});

		// In case there's a section that matches data
		if (sectionExists) {
			throw `Ya existe una sección ${description.toUpperCase()} para el año y periodo seleccionado`;
		}

		return await db.section.update({
			where: { id },
			data: {
				description: description.toUpperCase(),
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const id = Number(params.id);

	return formAction({
		request,
		schema: sectionSchema,
		mutation,
		transformValues: (values) => ({ ...values, id }),
		successPath: "/management/sections",
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const id = Number(params.id);

	const section = await db.section.findUnique({
		where: { id },
		select: {
			description: true,
			academicPeriod: {
				select: {
					startDate: true,
					endDate: true,
				},
			},
			studyYear: {
				select: {
					year: true,
				},
			},
		},
	});

	if (!section) {
		throw new Response("Sección no ha sido encontrada", {
			status: 404,
		});
	}

	return json({
		section: {
			description: section.description,
			academicPeriod: getAcademicPeriodRange(
				section.academicPeriod.startDate,
				section.academicPeriod.endDate
			),
			studyYear: section.studyYear.year,
		},
	});
};

export default function EditSectionRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar sección"
				supportingText="Una sección se apertura en cada periodo para un año"
			>
				<Form
                    method="post"
					schema={sectionSchema}
					values={{ description: data.section.description }}
				>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<TextField
									disabled={true}
									label="Periodo Académico"
									name="academicPeriod"
									value={data.section.academicPeriod}
								/>

								<TextField
									disabled={true}
									label="Año"
									name="year"
									value={data.section.studyYear}
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

								<Button type="submit">Actualizar</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
