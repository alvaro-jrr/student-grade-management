import type { Dispatch, ReactNode, SetStateAction } from "react";
import { NavLink } from "@remix-run/react";
import bookIconUrl from "~/assets/book-icon.svg";
import { XMarkIcon } from "@heroicons/react/24/outline";

const LINKS = [
	{ name: "Inicio", to: "/management" },
	{ name: "Periodos Académicos", to: "academic-periods" },
];

interface SideBarProps {
	children?: ReactNode;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function SideBar({ children, isOpen, setIsOpen }: SideBarProps) {
	return (
		<>
			<div
				className="fixed inset-0 z-20 flex min-h-screen w-full max-w-xs translate-x-[-100%] flex-col justify-between border-r bg-white p-6 shadow-sm transition-transform will-change-transform data-[visible=true]:translate-x-0 lg:relative lg:left-0 lg:translate-x-0"
				data-visible={isOpen}
				id="sidebar"
			>
				<div className="flex flex-col gap-y-6">
					<div className="flex justify-between">
						<div className="flex items-center gap-x-2">
							<img
								src={bookIconUrl}
								className="h-6 w-6"
								alt="Libro"
							/>

							<h1 className="font-heading text-2xl font-medium uppercase text-slate-700">
								Santa Marta
							</h1>
						</div>

						<button
							className="self-end p-2 text-slate-900 lg:hidden"
							onClick={() => setIsOpen(false)}
						>
							<XMarkIcon className="h-6 w-6" />

							<span className="sr-only">Cerrar menú</span>
						</button>
					</div>

					<nav>
						<ul className="flex flex-col gap-y-2">
							{LINKS.map((link) => (
								<li key={link.to}>
									<NavLink
										className="block rounded-md px-6 py-2 font-medium text-slate-700 transition-colors hover:text-blue-500 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-500"
										to={link.to}
										end={link.to === "/management"}
									>
										{link.name}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>
				</div>

				{children}
			</div>

			<div
				aria-expanded={isOpen}
				aria-controls="sidebar"
				className="invisible fixed inset-0 z-10 bg-slate-900/30 aria-expanded:visible lg:aria-expanded:invisible"
				onClick={() => setIsOpen(false)}
			/>
		</>
	);
}
