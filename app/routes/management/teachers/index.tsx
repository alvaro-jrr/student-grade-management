import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { ButtonLink } from "~/components/button";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	const teachers = await db.teacher.findMany({
		select: {
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			specialty: true,
			identityCard: true,
		},
	});

	return json({
		teachers: teachers.map(
			({ person: { firstname, lastname }, ...restOfTeacher }) => {
				return {
					fullname: `${firstname} ${lastname}`,
					...restOfTeacher,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	fullname: string;
	identityCard: string;
	specialty: string;
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
	columnHelper.accessor("specialty", {
		header: "Especialidad",
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

export default function TeachersIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.teachers} />;
}
