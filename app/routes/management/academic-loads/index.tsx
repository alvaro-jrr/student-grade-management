import type { LoaderArgs } from "@remix-run/node";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { ButtonLink } from "~/components/button";
import { Select, TextField } from "~/components/form-elements";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const url = new URL(request.url);

	// Get search params
	const teacherId = url.searchParams.get("teacher-id");
	const academicPeriodId = url.searchParams.get("academic-period");

	const academicPeriods = await db.academicPeriod.findMany({
		select: { id: true, startDate: true, endDate: true },
	});

	// Get academic loads
	const academicLoads = await db.academicLoad.findMany({
		where: {
			academicPeriodId: academicPeriodId
				? Number(academicPeriodId)
				: undefined,
			teacherIdentityCard: teacherId
				? {
						startsWith: teacherId,
				  }
				: undefined,
		},
		select: {
			id: true,
			academicPeriod: {
				select: { startDate: true, endDate: true },
			},
			teacher: {
				select: {
					person: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
					identityCard: true,
				},
			},
			courseByStudyYear: {
				select: {
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
			},
		},
	});

	return json({
		teacherId,
		academicPeriodId,
		academicPeriods,
		academicLoads,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	academicPeriod: {
		startDate: string;
		endDate: string;
	};
	teacher: {
		person: {
			firstname: string;
			lastname: string;
		};
		identityCard: string;
	};
	courseByStudyYear: {
		course: {
			title: string;
		};
		studyYear: {
			year: number;
		};
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("academicPeriod", {
		header: "Periodo Académico",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return academicPeriodInterval(startDate, endDate);
		},
	}),
	columnHelper.accessor("courseByStudyYear.studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("courseByStudyYear.course.title", {
		header: "Asignatura",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("teacher.person", {
		header: "Docente",
		cell: (info) => {
			const { firstname, lastname } = info.getValue();

			return `${firstname} ${lastname}`;
		},
	}),
	columnHelper.accessor("teacher.identityCard", {
		header: "Cédula de Identidad",
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

export default function AcademicLoadsIndexRoute() {
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
							data.academicPeriodId === null &&
							data.teacherId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<TextField
						name="teacher-id"
						placeholder="ej: 28385587"
						label="Cédula de Identidad"
						type="search"
						defaultValue={data.teacherId || ""}
					/>

					<Select
						label="Periodo Académico"
						name="academic-period"
						placeholder="Seleccione un periodo"
						defaultValue={data.academicPeriodId || ""}
						options={data.academicPeriods.map(
							({ id, startDate, endDate }) => ({
								value: id,
								name: academicPeriodInterval(
									startDate,
									endDate
								),
							})
						)}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.academicLoads} />
		</div>
	);
}
