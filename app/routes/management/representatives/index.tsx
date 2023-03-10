import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { TextField } from "~/components/form-elements";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search param
	const representativeId = url.searchParams.get("representative-id");

	const representatives = await db.representative.findMany({
		where: {
			identityCard: {
				startsWith: representativeId || undefined,
			},
		},
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
			email: true,
			phoneNumber: true,
		},
	});

	return json({
		representatives,
		representativeId,
	});
};

const columnHelper = createColumnHelper<{
	identityCard: string;
	email: string;
	person: {
		firstname: string;
		lastname: string;
	};
	phoneNumber: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("person", {
		header: "Nombre Completo",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
	}),
	columnHelper.accessor("identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("email", {
		header: "Email",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("phoneNumber", {
		header: "Telefono",
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
	const submit = useSubmit();

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-center gap-4 md:flex-row md:items-center md:justify-start">
				<FunnelIcon className="h-6 w-6 text-gray-500" />

				<Form
					method="get"
					onChange={(event) => {
						const isFirstSearch = data.representativeId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						type="search"
						name="representative-id"
						placeholder="ej: 28385587"
						label="Cédula de Identidad"
						defaultValue={data.representativeId || ""}
					/>
				</Form>
			</div>
			<Table columns={columns} data={data.representatives} />
		</div>
	);
}
