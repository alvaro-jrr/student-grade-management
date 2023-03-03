import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { ButtonLink } from "~/components/button";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const courses = await db.course.findMany({
		select: {
			id: true,
			studyYear: { select: { year: true } },
			title: true,
		},
		orderBy: { studyYear: { year: "asc" } },
	});

	return json({
		courses: courses.map(({ studyYear: { year }, ...restOfCourse }) => ({
			year,
			...restOfCourse,
		})),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	year: number;
	title: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("title", {
		header: "Titulo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("year", {
		header: "Año de Estudio",
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

	return <Table columns={columns} data={data.courses} />;
}
