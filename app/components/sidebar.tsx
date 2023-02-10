import { NavLink } from "@remix-run/react";
import bookIconUrl from "~/assets/book-icon.svg";

const LINKS = [{ name: "Inicio", to: "/management" }];

export default function SideBar() {
	return (
		<div className="flex flex-col w-full max-w-xs min-h-screen p-6 border-r shadow-sm gap-y-6">
			<div className="flex items-center gap-x-2">
				<img src={bookIconUrl} className="w-6 h-6" alt="Libro" />

				<h1 className="text-2xl font-medium uppercase font-heading text-slate-700">
					Santa Marta
				</h1>
			</div>

			<nav>
				<ul className="flex flex-col gap-y-2">
					{LINKS.map((link) => (
						<li key={link.to}>
							<NavLink
								className="block rounded-md px-6 py-2 font-medium text-slate-700 hover:text-blue-500 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-500"
								to={
									link.to === "/management"
										? link.to
										: `/management${link.to}`
								}
							>
								{link.name}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
}
