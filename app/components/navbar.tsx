import { NavLink, Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Bars3BottomRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import bookIconUrl from "~/assets/book-icon.svg";

const LINKS = [
	{ name: "Cursos", to: "/courses" },
	{ name: "Sobre Nosotros", to: "/about-us" },
	{ name: "Contacto", to: "/contact" },
];

const MOBILE_LINKS = [
	{ name: "Inicio", to: "/" },
	...LINKS,
	{ name: "Iniciar Sesión", to: "/login" },
];

function MobileMenuList({ isOpen }: { isOpen: boolean }) {
	useEffect(() => {
		if (isOpen) {
			// don't use overflow-hidden, as that toggles the scrollbar and causes layout shift
			document.body.classList.add("fixed");
			document.body.classList.add("inset-0");
			document.body.classList.add("overflow-y-scroll");

			// alternatively, get bounding box of the menu, and set body height to that.
			document.body.style.height = "100vh";
		} else {
			document.body.classList.remove("fixed");
			document.body.classList.remove("inset-0");
			document.body.classList.remove("overflow-y-scroll");
			document.body.style.removeProperty("height");
		}
	}, [isOpen]);

	return (
		<ul
			id="mobile-navigation"
			data-visible={isOpen}
			className="fixed inset-0 translate-x-full divide-y bg-gray-50 py-16 px-8 transition-transform data-[visible=true]:translate-x-0"
		>
			{MOBILE_LINKS.map((link) => (
				<li key={link.to}>
					<Link
						className="block px-2 py-4 font-medium text-slate-500"
						to={link.to}
					>
						{link.name}
					</Link>
				</li>
			))}
		</ul>
	);
}

function MobileMenu() {
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

			<MobileMenuList isOpen={isOpen} />
		</>
	);
}

export default function NavBar() {
	return (
		<div className="px-[5vw] py-6">
			<nav className="flex items-center justify-between lg:grid lg:grid-cols-3 ">
				<Link className="flex gap-x-2" to="/">
					<img src={bookIconUrl} alt="Libro" className="w-8" />

					<h1 className="text-2xl font-medium uppercase text-slate-700">
						Santa Marta
					</h1>
				</Link>

				<ul className="hidden lg:flex lg:justify-between">
					{LINKS.map((link) => (
						<li
							key={link.to}
							className="whitespace-nowrap font-medium text-slate-500 transition-colors hover:text-slate-600"
						>
							<NavLink className="block px-5 py-2" to={link.to}>
								{link.name}
							</NavLink>
						</li>
					))}
				</ul>

				<div className="lg:hidden">
					<MobileMenu />
				</div>

				<div className="hidden justify-self-end lg:block">
					<NavLink
						to="/login"
						className="block px-5 py-2 font-medium text-slate-500 transition-colors hover:text-slate-600"
					>
						Iniciar Sesión
					</NavLink>
				</div>
			</nav>
		</div>
	);
}
