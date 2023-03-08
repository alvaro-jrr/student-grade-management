import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const coursesByStudyYear = await db.courseByStudyYear.findMany({
		select: {
			id: true,
			course: {
				select: {
					title: true,
				},
			},
			studyYear: {
				select: {
					year: true,
				},
			},
		},
		orderBy: {
			studyYear: {
				year: "asc",
			},
		},
	});

	return json({ coursesByStudyYear });
};

const columnHelper = createColumnHelper<{
	id: number;
	course: {
		title: string;
	};
	studyYear: {
		year: number;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("id", {
		header: "",
		cell: (info) => {
			const id = info.getValue();

			return (
				<div className="flex justify-end">
					<ButtonLink variant="text" to={`edit/${id}`}>
						Editar
					</ButtonLink>
				</div>
			);
		},
	}),
];

export default function CourseByStudyYearIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.coursesByStudyYear} />;
}
