import { FunnelIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "~/components/button";
import { TextField } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search param
	const representativeId = url.searchParams.get("representative-id");
	const studentId = url.searchParams.get("student-id");

	const representations = await db.representativeByStudent.findMany({
		where: {
			representativeIdentityCard: {
				startsWith: representativeId || undefined,
			},
			studentIdentityCard: {
				startsWith: studentId || undefined,
			},
		},
		select: {
			id: true,
			representative: {
				select: {
					identityCard: true,
					person: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
				},
			},
			student: {
				select: {
					identityCard: true,
					person: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
				},
			},
		},
	});

	return json({
		representativeId,
		studentId,
		representations,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	representative: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
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
			columnHelper.accessor("representative.person", {
				header: "Nombre Completo",
				cell: (info) => {
					const { firstname, lastname } = info.getValue();

					return `${firstname} ${lastname}`;
				},
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
			columnHelper.accessor("student.person", {
				header: "Nombre Completo",
				cell: (info) => {
					const { firstname, lastname } = info.getValue();

					return `${firstname} ${lastname}`;
				},
			}),
		],
	}),
	columnHelper.accessor("id", {
		header: "",
		cell: (info) => {
			const id = info.getValue();

			return (
				<div className="flex justify-end">
					<Form action={`delete/${id}`} method="post">
						<Button variant="danger" type="submit">
							Eliminar
						</Button>
					</Form>
				</div>
			);
		},
	}),
];

export default function RepresentationsIndexRoute() {
	const data = useLoaderData<typeof loader>();
	const submit = useSubmit();

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-center gap-4 md:flex-row md:items-center md:justify-start">
				<FunnelIcon className="h-6 w-6 text-gray-500" />

				<Form
					className="flex flex-col gap-4 md:flex-row"
					method="get"
					onChange={(event) => {
						const isFirstSearch =
							data.representativeId === null &&
							data.studentId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						type="search"
						name="representative-id"
						placeholder="ej: 28385587"
						label="Represetante C.I"
						defaultValue={data.representativeId || ""}
					/>

					<TextField
						type="search"
						name="student-id"
						placeholder="ej: 28385587"
						label="Estudiante C.I"
						defaultValue={data.studentId || ""}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.representations} />
		</div>
	);
}
