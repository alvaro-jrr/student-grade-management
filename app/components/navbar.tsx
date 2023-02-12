import { NavLink, Link } from "@remix-run/react";
import { useState } from "react";
import {
	ArrowRightIcon,
	Bars3BottomRightIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import bookIconUrl from "~/assets/book-icon.svg";
import { ButtonLink } from "./button";

const LINKS = [
	{ name: "Asignaturas", to: "/courses" },
	{ name: "Sobre Nosotros", to: "/about-us" },
	{ name: "Contacto", to: "/contact" },
];

const MOBILE_LINKS = [{ name: "Inicio", to: "/" }, ...LINKS];

const variantsLookup = {
	mobile: "block px-2 py-4 font-medium text-slate-500",
	desktop:
		"block px-5 py-2 font-medium text-slate-500 transition-colors hover:bg-gray-100 aria-[current=page]:bg-gray-100 rounded-full",
};

function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				aria-controls="mobile-navigation"
				aria-expanded={isOpen}
				className="relative z-10 p-2 text-slate-900"
				onClick={() => setIsOpen((isOpen) => !isOpen)}
			>
				{isOpen ? (
					<XMarkIcon className="h-6 w-6" />
				) : (
					<Bars3BottomRightIcon className="h-6 w-6" />
				)}

				<span className="sr-only">Menu</span>
			</button>

			<ul
				className="fixed inset-0 translate-x-full divide-y bg-gray-50 py-16 px-8 transition-transform data-[visible=true]:translate-x-0"
				data-visible={isOpen}
				id="mobile-navigation"
			>
				{MOBILE_LINKS.map((link) => (
					<li key={link.to}>
						<Link className={variantsLookup.mobile} to={link.to}>
							{link.name}
						</Link>
					</li>
				))}

				{isLoggedIn ? (
					<li>
						<Link
							className={variantsLookup.mobile}
							to="/management"
						>
							Volver al sistema
						</Link>
					</li>
				) : (
					<li>
						<Link className={variantsLookup.mobile} to="/login">
							Iniciar sesión
						</Link>
					</li>
				)}
			</ul>
		</>
	);
}

export default function NavBar({ isLoggedIn }: { isLoggedIn: boolean }) {
	return (
		<header className="sticky top-0 z-10 bg-white px-[5vw] py-6">
			<nav className="flex items-center justify-between lg:grid lg:grid-cols-3">
				<Link className="flex gap-x-2" to="/">
					<img src={bookIconUrl} alt="Libro" className="w-8" />

					<h1 className="font-heading text-2xl font-medium uppercase text-slate-700">
						Santa Marta
					</h1>
				</Link>

				<ul className="hidden lg:flex lg:justify-evenly">
					{LINKS.map((link) => (
						<li key={link.to} className="whitespace-nowrap">
							<NavLink
								className={variantsLookup.desktop}
								to={link.to}
							>
								{link.name}
							</NavLink>
						</li>
					))}
				</ul>

				<div className="lg:hidden">
					<MobileMenu isLoggedIn={isLoggedIn} />
				</div>

				<div className="hidden justify-self-end lg:block">
					{isLoggedIn ? (
						<ButtonLink
							variant="text"
							size="small"
							to="/management"
							Icon={ArrowRightIcon}
						>
							Volver al sistema
						</ButtonLink>
					) : (
						<NavLink to="/login" className={variantsLookup.desktop}>
							Iniciar Sesión
						</NavLink>
					)}
				</div>
			</nav>
		</header>
	);
}
