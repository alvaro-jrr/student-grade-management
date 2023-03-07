import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Bars3BottomRightIcon } from "@heroicons/react/24/outline";
import { NavLink, Outlet, useOutletContext } from "@remix-run/react";
import { H2, Paragraph } from "./typography";

type Route = {
	name: string;
	to: string;
};

interface SectionProps {
	title: string;
	description?: string;
	children?: ReactNode;
	ActionComponent?: () => JSX.Element;
	routes?: Route[];
}

interface NavBarProps {
	routes: Route[];
}

function NavBar({ routes }: NavBarProps) {
	return (
		<nav>
			<ul className="flex gap-x-4 overflow-auto">
				{routes.map((route) => (
					<li className="whitespace-nowrap" key={route.to}>
						<NavLink
							className="block rounded-full border border-gray-200 p-2 px-4 font-medium text-gray-500 transition-colors hover:border-blue-200 hover:text-blue-500 aria-[current=page]:border-blue-200 aria-[current=page]:text-blue-500"
							to={route.to}
							end={route.to.includes("management")}
						>
							{route.name}
						</NavLink>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default function Section({
	ActionComponent,
	children,
	description,
	title,
	routes,
}: SectionProps) {
	const [isMenuOpen, setIsMenuOpen] =
		useOutletContext<[boolean, Dispatch<SetStateAction<boolean>>]>();

	return (
		<div className="grid h-screen flex-1 grid-rows-[auto_1fr] gap-y-6 overflow-auto p-6">
			<div className="flex min-w-0 flex-col gap-y-4">
				<header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex justify-between gap-x-2">
						<div className="space-y-2">
							<H2>{title}</H2>

							{description ? (
								<Paragraph>{description}</Paragraph>
							) : null}
						</div>

						<button
							aria-controls="sidebar"
							aria-expanded={isMenuOpen}
							className="self-start p-2 text-gray-900 lg:hidden"
							type="button"
							onClick={() => setIsMenuOpen(true)}
						>
							<Bars3BottomRightIcon className="h-6 w-6" />

							<span className="sr-only">Abrir menú</span>
						</button>
					</div>

					{ActionComponent ? (
						<div>
							<ActionComponent />
						</div>
					) : null}
				</header>

				{routes ? <NavBar routes={routes} /> : null}
			</div>

			<main className="min-w-0">{children ? children : <Outlet />}</main>
		</div>
	);
}
