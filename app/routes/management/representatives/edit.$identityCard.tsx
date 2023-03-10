import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { Controller } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import PhoneField, { TextField } from "~/components/form-elements";
import { representativeSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const editRepresentativeSchema = representativeSchema.extend({
	currentIdentityCard: z.string(),
});

const mutation = makeDomainFunction(editRepresentativeSchema)(
	async ({
		firstname,
		lastname,
		identityCard,
		email,
		phoneNumber,
		currentIdentityCard,
	}) => {
		// Check if there's change between IDs
		if (
			identityCard !== currentIdentityCard &&
			(await isIdentityCardStored(identityCard))
		) {
			throw "La nueva cédula de identidad ya ha sido tomada";
		}

		// Check number phone
		if (!isValidPhoneNumber(phoneNumber)) {
			throw new InputError("Debe intoducir un telefono valido", "phone");
		}

		return await db.representative.update({
			where: { identityCard: currentIdentityCard },
			data: {
				email,
				phoneNumber,
				person: {
					update: {
						firstname,
						lastname,
						identityCard,
					},
				},
			},
		});
	}
);

export const action = async ({ request, params }: ActionArgs) => {
	const identityCard = String(params.identityCard);

	return formAction({
		request,
		schema: representativeSchema,
		mutation,
		successPath: "/management/representatives",
		transformValues: (values) => ({
			...values,
			currentIdentityCard: identityCard,
		}),
	});
};

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = String(params.identityCard);

	const representative = await db.representative.findUnique({
		where: { identityCard },
		select: {
			identityCard: true,
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			email: true,
			phoneNumber: true,
		},
	});

	if (!representative) {
		throw new Response("Representante no ha sido encontrado", {
			status: 404,
		});
	}

	return json({
		representative,
	});
};

export default function EditRepresentativeRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Editar representante"
				supportingText="Actualiza los datos de un representante requerido"
			>
				<Form
					method="post"
					schema={representativeSchema}
					values={{
						firstname: data.representative.person.firstname,
						lastname: data.representative.person.lastname,
						...data.representative,
					}}
				>
					{({ register, formState: { errors }, control, Errors }) => (
						<>
							<div className="space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row">
									<TextField
										error={errors.firstname?.message}
										label="Nombre"
										placeholder="ej: John"
										{...register("firstname")}
									/>

									<TextField
										error={errors.lastname?.message}
										placeholder="ej: Doe"
										label="Apellido"
										{...register("lastname")}
									/>
								</div>

								<TextField
									error={errors.identityCard?.message}
									label="Cédula de Identidad"
									placeholder="ej: 28385587"
									{...register("identityCard")}
								/>

								<TextField
									error={errors.email?.message}
									type="email"
									placeholder="ej: johndoe@gmail.com"
									label="Email"
									{...register("email")}
								/>

								<Controller
									name="phoneNumber"
									control={control}
									render={({
										field: { name, onChange, value },
									}) => (
										<PhoneField
											error={errors.phoneNumber?.message}
											name={name}
											onChange={onChange}
											value={value}
											label="Telefono"
											placeholder="ej: +58 4121152671"
										/>
									)}
								/>
							</div>

							<Errors />

							<div className="flex justify-end gap-4">
								<ButtonLink
									variant="secondary"
									to="/management/representatives"
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
