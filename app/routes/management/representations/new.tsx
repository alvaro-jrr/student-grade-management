import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import { Select } from "~/components/form-elements";
import { representationSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";

const mutation = makeDomainFunction(representationSchema)(
	async ({ representativeIdentityCard, studentIdentityCard }) => {
		const representativesCount = await db.representativeByStudent.count({
			where: { studentIdentityCard },
		});

		// In case there are 3, don't add representative
		if (representativesCount === 3) {
			throw "Estudiante ya tiene 3 representantes, no se puede agregar otro más";
		}

		const isStudentRepresentative =
			(await db.representativeByStudent.findFirst({
				where: {
					representativeIdentityCard,
					studentIdentityCard,
				},
			})) !== null;

		if (isStudentRepresentative) {
			throw "Estudiante ya es representado por el representante seleccionado";
		}

		return await db.representativeByStudent.create({
			data: {
				representativeIdentityCard,
				studentIdentityCard,
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: representationSchema,
		mutation,
		successPath: "/management/representations",
	});
};

export const loader = async () => {
	const representatives = await db.representative.findMany({
		select: {
			identityCard: true,
			person: { select: { firstname: true, lastname: true } },
		},
	});

	const students = await db.student.findMany({
		select: {
			identityCard: true,
			person: { select: { firstname: true, lastname: true } },
		},
	});

	return json({
		representatives: representatives.map(
			({ person: { firstname, lastname }, identityCard }) => ({
				fullname: `${firstname} ${lastname}`,
				identityCard,
			})
		),
		students: students.map(
			({ person: { firstname, lastname }, identityCard }) => ({
				fullname: `${firstname} ${lastname}`,
				identityCard,
			})
		),
	});
};

export default function NewRepresentationRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear representación"
				supportingText="Establece la relación entre un representante y un estudiante"
			>
				<Form method="post" schema={representationSchema}>
					{({ Errors, register, formState: { errors } }) => (
						<>
							<div className="space-y-4">
								<Select
									error={
										errors.representativeIdentityCard
											?.message
									}
									label="Representante"
									placeholder="Seleccione un representante"
									options={data.representatives.map(
										(representative) => ({
											name: `${representative.fullname} - CI: ${representative.identityCard}`,
											value: representative.identityCard,
										})
									)}
									{...register("representativeIdentityCard")}
								/>

								<Select
									error={errors.studentIdentityCard?.message}
									label="Estudiante"
									placeholder="Seleccione un estudiante"
									options={data.students.map((student) => ({
										name: `${student.fullname} - CI: ${student.identityCard}`,
										value: student.identityCard,
									}))}
									{...register("studentIdentityCard")}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-x-4">
								<ButtonLink
									variant="secondary"
									to="/management/representations"
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
