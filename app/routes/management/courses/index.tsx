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

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search param
	const title = url.searchParams.get("title");

	// Get study years
	const studyYears = await db.studyYear.findMany();

	const courses = await db.course.findMany({
		where: {
			title: {
				startsWith: title || undefined,
			},
		},
		select: {
			id: true,
			title: true,
		},
		orderBy: { title: "asc" },
	});

	return json({
		title,
		courses,
		studyYears,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	title: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("title", {
		header: "Titulo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("id", {
		header: "",
		cell: (info) => {
			const id = info.getValue();

			return (
				<div className="flex justify-end">
					<ButtonLink to={`edit/${id}`} variant="text">
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function CoursesIndexRoute() {
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
						const isFirstSearch = data.title === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						type="search"
						name="title"
						placeholder="ej: Historia Universal"
						label="Titulo"
						defaultValue={data.title || ""}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.courses} />
		</div>
	);
}
