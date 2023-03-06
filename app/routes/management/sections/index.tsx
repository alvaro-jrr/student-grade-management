import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createColumnHelper } from "@tanstack/react-table";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import Table from "~/components/table";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";
import { academicPeriodInterval } from "~/utils";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Select } from "~/components/form-elements";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);
	const url = new URL(request.url);

	// Get search params
	const academicPeriodId = url.searchParams.get("academic-period");
	const studyYearId = url.searchParams.get("study-year");

	// Get periods and study years
	const academicPeriods = await db.academicPeriod.findMany();
	const studyYears = await db.studyYear.findMany();

	const sections = await db.section.findMany({
		where: {
			academicPeriodId: academicPeriodId
				? Number(academicPeriodId)
				: undefined,
			studyYearId: studyYearId ? Number(studyYearId) : undefined,
		},
		select: {
			id: true,
			description: true,
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
		academicPeriodId,
		studyYearId,
		academicPeriods,
		studyYears,
		sections,
	});
};

const columnHelper = createColumnHelper<{
	id: number;
	description: string;
	studyYear: {
		year: number;
	};
	academicPeriod: {
		startDate: string;
		endDate: string;
	};
}>();

// Table columns
const columns = [
	columnHelper.accessor("academicPeriod", {
		header: "Periodo",
		cell: (info) => {
			const { startDate, endDate } = info.getValue();

			return academicPeriodInterval(startDate, endDate);
		},
	}),
	columnHelper.accessor("studyYear.year", {
		header: "Año",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("description", {
		header: "Sección",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("id", {
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

export default function SectionsIndexRoute() {
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
							data.studyYearId === null;

						submit(event.currentTarget, {
							replace: !isFirstSearch,
						});
					}}
				>
					<Select
						label="Periodo Académico"
						name="academic-period"
						placeholder="Seleccione un periodo"
						options={data.academicPeriods.map(
							({ id, startDate, endDate }) => ({
								name: academicPeriodInterval(
									startDate,
									endDate
								),
								value: id,
							})
						)}
					/>

					<Select
						label="Año"
						name="study-year"
						placeholder="Seleccione un año"
						defaultValue={data.studyYearId || ""}
						options={data.studyYears.map(({ id, year }) => ({
							value: id,
							name: year,
						}))}
					/>
				</Form>
			</div>

			<Table columns={columns} data={data.sections} />
		</div>
	);
}
