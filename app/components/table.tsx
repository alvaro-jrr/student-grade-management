import type { ColumnDef, Table as TableType } from "@tanstack/react-table";
import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import { Paragraph } from "./typography";

interface TableProps<T> {
	columns: ColumnDef<T, any>[];
	data: T[];
}

interface PaginationProps<T> {
	table: TableType<T>;
}

function Pagination<T>({ table }: PaginationProps<T>) {
	return (
		<div className="flex items-center justify-between">
			<Paragraph>
				Página {table.getState().pagination.pageIndex + 1} de{" "}
				{table.getPageCount()}
			</Paragraph>

			<div>
				<button
					className="p-2 text-gray-700 disabled:opacity-50"
					disabled={!table.getCanPreviousPage()}
					onClick={() => table.setPageIndex(0)}
					title="Ir a primera página"
				>
					<ChevronDoubleLeftIcon className="h-6 w-6" />
				</button>

				<button
					className="p-2 text-gray-700 disabled:opacity-50"
					disabled={!table.getCanPreviousPage()}
					onClick={() => table.previousPage()}
					title="Ir a página previa"
				>
					<ChevronLeftIcon className="h-6 w-6" />
				</button>

				<button
					className="p-2 text-gray-700 disabled:opacity-50"
					disabled={!table.getCanNextPage()}
					onClick={() => table.nextPage()}
					title="Ir a siguiente página"
				>
					<ChevronRightIcon className="h-6 w-6" />
				</button>

				<button
					className="p-2 text-gray-700 disabled:opacity-50"
					disabled={!table.getCanNextPage()}
					onClick={() => table.setPageIndex(table.getPageCount() - 1)}
					title="Ir a última página"
				>
					<ChevronDoubleRightIcon className="h-6 w-6" />
				</button>
			</div>
		</div>
	);
}

export default function Table<T>({ columns, data }: TableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	// Get header groups and rows
	const headerGroups = table.getHeaderGroups();
	const rows = table.getRowModel().rows;

	// Get column count
	const columnsCount = headerGroups[headerGroups.length - 1].headers.length;

	return (
		<div className="space-y-2">
			<Pagination table={table} />

			<div className="overflow-auto rounded-md border shadow-sm">
				<table className="w-full">
					<thead>
						{headerGroups.map((headerGroup) => (
							<tr key={headerGroup.id} className="border-b">
								{headerGroup.headers.map((header) => {
									return (
										<th
											className="whitespace-nowrap p-4 font-medium text-gray-700"
											key={header.id}
											colSpan={header.colSpan}
										>
											{header.isPlaceholder ? null : (
												<span className="block text-left">
													{flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
												</span>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>

					<tbody>
						{rows.length ? (
							rows.map((row) => (
								<tr
									key={row.id}
									className="border-b last:border-0 hover:bg-gray-50"
								>
									{row.getVisibleCells().map((cell) => {
										return (
											<td
												className="p-4 text-gray-500"
												key={cell.id}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										);
									})}
								</tr>
							))
						) : (
							<tr>
								<td
									className="p-4 text-center text-gray-500"
									colSpan={columnsCount}
								>
									No hay datos disponibles
								</td>
							</tr>
						)}
					</tbody>

					<tfoot>
						{table.getFooterGroups().map((footerGroup) => (
							<tr key={footerGroup.id}>
								{footerGroup.headers.map((header) => (
									<th key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.footer,
													header.getContext()
											  )}
									</th>
								))}
							</tr>
						))}
					</tfoot>
				</table>
			</div>
		</div>
	);
}
