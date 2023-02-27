import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	const representations = await db.representativeByStudent.findMany({
		select: {
			id: true,
			representative: {
				select: {
					person: {
						select: {
							firstname: true,
							lastname: true,
							identityCard: true,
						},
					},
				},
			},
			student: {
				select: {
					person: {
						select: {
							firstname: true,
							lastname: true,
							identityCard: true,
						},
					},
				},
			},
		},
	});

	return json({
		representations: representations.map(
			({ id, representative, student }) => ({
				id,
				representative: {
					fullname: `${representative.person.firstname} ${representative.person.lastname}`,
					identityCard: representative.person.identityCard,
				},
				student: {
					fullname: `${student.person.firstname} ${student.person.lastname}`,
					identityCard: student.person.identityCard,
				},
			})
		),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	representative: {
		fullname: string;
		identityCard: string;
	};
	student: {
		fullname: string;
		identityCard: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.group({
		header: "Representante",
		columns: [
			columnHelper.accessor("representative.identityCard", {
				header: "Cédula",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("representative.fullname", {
				header: "Nombre Completo",
				cell: (info) => info.getValue(),
			}),
		],
	}),
	columnHelper.group({
		header: "Estudiante",
		columns: [
			columnHelper.accessor("student.identityCard", {
				header: "Cédula",
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor("student.fullname", {
				header: "Nombre Completo",
				cell: (info) => info.getValue(),
			}),
		],
	}),
];

export default function RepresentationsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.representations} />;
}
