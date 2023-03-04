import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const studentsBySection = await db.studentBySection.findMany({
		select: {
			id: true,
			section: {
				select: {
					studyYear: {
						select: {
							year: true,
						},
					},
					academicPeriod: {
						select: {
							startDate: true,
							endDate: true,
						},
					},
					description: true,
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
		orderBy: {
			section: {
				studyYear: {
					year: "desc",
				},
			},
		},
	});

	return json({
		studentsBySection: studentsBySection.map(
			({
				section: { academicPeriod, ...restOfSection },
				...restOfStudentBySection
			}) => ({
				section: {
					academicPeriod: {
						range: getAcademicPeriodRange(
							academicPeriod.startDate,
							academicPeriod.endDate
						),
					},
					...restOfSection,
				},
				...restOfStudentBySection,
			})
		),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	section: {
		academicPeriod: {
			range: string;
		};
		description: string;
		studyYear: {
			year: number;
		};
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("section.academicPeriod.range", {
		header: "Periodo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("section", {
		header: "Año - Sección",
		cell: (info) => {
			const { description, studyYear } = info.getValue();

			return `${studyYear.year} ${description}`;
		},
	}),
	columnHelper.accessor("student.identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("student.person", {
		header: "Estudiante",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
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

export default function StudentsBySectionIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.studentsBySection} />;
}
