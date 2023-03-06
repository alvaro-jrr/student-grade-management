import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { ButtonLink } from "~/components/button";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { TextField } from "~/components/form-elements";
import { dateFormat } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search param
	const studentId = url.searchParams.get("student-id");

	const students = await db.student.findMany({
		where: {
			identityCard: studentId
				? {
						startsWith: studentId,
				  }
				: undefined,
		},
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			identityCard: true,
			birthDate: true,
		},
	});

	return json({
		identityCard: studentId,
		students,
	});
};

const columnHelper = createColumnHelper<{
	identityCard: string;
	birthDate: string;
	person: {
		firstname: string;
		lastname: string;
	};
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
	columnHelper.accessor("birthDate", {
		header: "Fecha de Nacimiento",
		cell: (info) => dateFormat(info.getValue()),
	}),
	columnHelper.accessor("identityCard", {
		id: "actions",
		header: "",
		cell: (info) => {
			const identityCard = info.getValue();

			return (
				<div className="flex justify-end gap-x-4">
					<ButtonLink to={identityCard} variant="text">
						Ver Ficha
					</ButtonLink>

					<ButtonLink variant="text" to={`edit/${identityCard}`}>
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function StudentsIndexRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-center gap-4 md:flex-row md:items-center md:justify-start">
				<FunnelIcon className="h-6 w-6 text-gray-500" />

				<Form
					method="get"
					onChange={(event) => {
						const isFirstSearch = data.identityCard === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						type="search"
						name="student-id"
						placeholder="ej: 28385587"
						label="Cédula de Identidad"
						defaultValue={data.identityCard || ""}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.students} />
		</div>
	);
}
