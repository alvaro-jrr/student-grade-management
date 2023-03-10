import type { ActionArgs } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { Controller } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Button, ButtonLink } from "~/components/button";
import Card from "~/components/card";
import { Form } from "~/components/form";
import PhoneField, { TextField } from "~/components/form-elements";
import { representativeSchema } from "~/schemas";
import { db } from "~/utils/db.server";
import { formAction } from "~/utils/form-action.server";
import { isIdentityCardStored } from "~/utils/session.server";

const mutation = makeDomainFunction(representativeSchema)(
	async ({ firstname, lastname, identityCard, email, phoneNumber }) => {
		const identityCardExists = await isIdentityCardStored(identityCard);

		// In case identity card is already taken
		if (identityCardExists) {
			throw "Cédula de identidad ya ha sido registrada anteriormente";
		}

		// Check number phone
		if (!isValidPhoneNumber(phoneNumber)) {
			throw new InputError(
				"Debe intoducir un telefono valido",
				"phoneNumber"
			);
		}

		return await db.person.create({
			data: {
				firstname,
				identityCard,
				lastname,
				role: "REPRESENTATIVE",
				representative: {
					create: {
						email,
						phoneNumber,
					},
				},
			},
		});
	}
);

export const action = async ({ request }: ActionArgs) => {
	return formAction({
		request,
		schema: representativeSchema,
		mutation,
		successPath: "/management/representatives",
	});
};

export default function NewRepresentativeRoute() {
	return (
		<div className="flex h-full items-center justify-center">
			<Card
				title="Crear representante"
				supportingText="Un representante puede observar las notas de sus representados"
			>
				<Form method="post" schema={representativeSchema}>
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

								<Button type="submit">Crear</Button>
							</div>
						</>
					)}
				</Form>
			</Card>
		</div>
	);
}
