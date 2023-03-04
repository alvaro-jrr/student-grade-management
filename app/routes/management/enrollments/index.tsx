import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { dateFormat, getAcademicPeriodRange } from "~/utils/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const enrollments = await db.enrollment.findMany({
		select: {
			id: true,
			createdAt: true,
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
			academicPeriod: {
				select: {
					startDate: true,
					endDate: true,
				},
			},
			studyYear: {
				select: {
					year: true,
				},
			},
		},
	});

	return json({
		enrollments: enrollments.map(
			({
				academicPeriod: { startDate, endDate },
				createdAt,
				...restOfEnrollment
			}) => ({
				academicPeriod: {
					range: getAcademicPeriodRange(startDate, endDate),
				},
				createdAt: dateFormat(createdAt),
				...restOfEnrollment,
			})
		),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	createdAt: string;
	student: {
		identityCard: string;
		person: {
			firstname: string;
			lastname: string;
		};
	};
	studyYear: {
		year: number;
	};
	academicPeriod: {
		range: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("createdAt", {
		header: "Fecha",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("academicPeriod.range", {
		header: "Periodo",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("student.person", {
		header: "Estudiante",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
	}),
	columnHelper.accessor("student.identityCard", {
		header: "Cédula",
		cell: (info) => info.getValue(),
	}),
];

export default function EnrollmentsIndexRoute() {
	const data = useLoaderData<typeof loader>();

	return <Table columns={columns} data={data.enrollments} />;
}
