import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	const representatives = await db.representative.findMany({
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
			email: true,
			phones: {
				select: {
					phoneNumber: true,
				},
			},
		},
	});

	return json({
		representatives: representatives.map(
			({
				person: { firstname, lastname },
				phones,
				...restOfRepresentative
			}) => {
				const phonesNumbers = phones.map((phone) => phone.phoneNumber);

				return {
					fullname: `${firstname} ${lastname}`,
					// @ts-ignore
					phones: new Intl.ListFormat("es", {
						style: "long",
						type: "conjunction",
					}).format(phonesNumbers) as string,
					...restOfRepresentative,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	identityCard: string;
	email: string;
	fullname: string;
	phones: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("fullname", {
		header: "Nombre Completo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("email", {
		header: "Email",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("phones", {
		header: "Telefonos",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		id: "actions",
		header: "",
		cell: (info) => {
			const identityCard = info.getValue();

			return (
				<div className="flex justify-end">
					<ButtonLink variant="text" to={`edit/${identityCard}`}>
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function RepresentativesIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.representatives} />;
}
