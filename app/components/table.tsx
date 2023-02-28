import type { ColumnDef } from "@tanstack/react-table";

import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";

interface TableProps<T> {
	columns: ColumnDef<T, any>[];
	data: T[];
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
		<div className="overflow-auto rounded-md border shadow-sm">
			<table className="w-full">
				<thead>
					{headerGroups.map((headerGroup) => (
						<tr key={headerGroup.id} className="border-b">
							{headerGroup.headers.map((header) => {
								return (
									<th
										className="whitespace-nowrap p-4 font-medium text-slate-700"
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
								className="border-b last:border-0 hover:bg-slate-50"
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
								className="p-4 text-center text-slate-500"
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
												header.column.columnDef.footer,
												header.getContext()
										  )}
								</th>
							))}
						</tr>
					))}
				</tfoot>
			</table>
		</div>
	);
}
