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
import { getAcademicPeriodRange } from "~/utils/utils";

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
							identityCard: true,
						},
					},
				},
			},
			course: {
				select: {
					title: true,
				},
			},
		},
	});

	return json({
		teacherId,
		academicPeriodId,
		academicPeriods: academicPeriods.map(({ id, startDate, endDate }) => ({
			id,
			range: getAcademicPeriodRange(startDate, endDate),
		})),
		academicLoads: academicLoads.map(
			({
				id,
				academicPeriod: { startDate, endDate },
				course,
				teacher: {
					person: { identityCard, firstname, lastname },
				},
			}) => {
				return {
					id,
					range: getAcademicPeriodRange(startDate, endDate),
					title: course.title,
					fullname: `${firstname} ${lastname}`,
					identityCard: identityCard,
				};
			}
		),
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	range: string;
	title: string;
	fullname: string;
	identityCard: string;
}>();

// Table columns
const columns = [
	columnHelper.accessor("range", {
		header: "Periodo Académico",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("fullname", {
		header: "Docente",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("identityCard", {
		header: "Cédula de Identidad",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("title", {
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
						options={data.academicPeriods.map(({ id, range }) => ({
							value: id,
							name: range,
						}))}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.academicLoads} />
		</div>
	);
}
