import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Bars3BottomRightIcon } from "@heroicons/react/24/outline";
import { Outlet, useOutletContext } from "@remix-run/react";
import { H2, Paragraph } from "./typography";

interface SectionProps {
	title: string;
	description?: string;
	children?: ReactNode;
	ActionComponent?: () => JSX.Element;
}

export default function Section({
	ActionComponent,
	children,
	description,
	title,
}: SectionProps) {
	const [isMenuOpen, setIsMenuOpen] =
		useOutletContext<[boolean, Dispatch<SetStateAction<boolean>>]>();

	return (
		<div className="grid h-full grid-rows-[auto_1fr] gap-y-6">
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

			<main className="overflow-auto">
				{children ? children : <Outlet />}
			</main>
		</div>
	);
}
