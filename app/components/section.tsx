import type { Dispatch, SetStateAction } from "react";
import { Bars3BottomRightIcon } from "@heroicons/react/24/outline";
import { Outlet, useOutletContext } from "@remix-run/react";
import { H2 } from "./typography";

interface SectionProps {
	title: string;
}

export default function Section({ title }: SectionProps) {
	const [isMenuOpen, setIsMenuOpen] =
		useOutletContext<[boolean, Dispatch<SetStateAction<boolean>>]>();

	return (
		<div className="flex flex-col gap-y-4">
			<header className="flex justify-between gap-x-2">
				<H2>{title}</H2>

				<button
					aria-controls="sidebar"
					aria-expanded={isMenuOpen}
					className="p-2 text-slate-900 lg:hidden"
					type="button"
					onClick={() => setIsMenuOpen(true)}
				>
					<Bars3BottomRightIcon className="h-6 w-6" />

					<span className="sr-only">Abrir menú</span>
				</button>
			</header>

			<main>
				<Outlet />
			</main>
		</div>
	);
}
