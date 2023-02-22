import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { format } from "date-fns";
import { ButtonLink } from "~/components/button";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	const students = await db.student.findMany({
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
		students: students.map(
			({
				person: { firstname, lastname },
				birthDate,
				...restOfStudent
			}) => {
				return {
					fullname: `${firstname} ${lastname}`,
					birthDate: format(birthDate, "dd/MM/yyyy"),
					...restOfStudent,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	fullname: string;
	identityCard: string;
	birthDate: string;
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
	columnHelper.accessor("birthDate", {
		header: "Fecha de Nacimiento",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		id: "actions",
		header: "",
		cell: (info) => {
			const identityCard = info.getValue();

			return (
				<div className="flex justify-end gap-x-4">
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

	return <Table columns={columns} data={data.students} />;
}
