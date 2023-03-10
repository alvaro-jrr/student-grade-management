import type { Dispatch, ReactNode, SetStateAction } from "react";
import { NavLink } from "@remix-run/react";
import type { RoleName } from "@prisma/client";
import bookIconUrl from "~/assets/book-icon.svg";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Link {
	name: string;
	to: string;
	roles: RoleName[];
}

const LINKS: Link[] = [
	{
		name: "Coordinadores",
		to: "coordinators",
		roles: ["ADMIN"],
	},
	{
		name: "Periodos Académicos",
		to: "academic-periods",
		roles: ["COORDINATOR"],
	},
	{
		name: "Secciones",
		to: "sections",
		roles: ["COORDINATOR"],
	},
	{
		name: "Docentes",
		to: "teachers",
		roles: ["COORDINATOR"],
	},
	{
		name: "Asignaturas",
		to: "courses",
		roles: ["COORDINATOR"],
	},
	{
		name: "Asignatura por Año",
		to: "course-by-study-year",
		roles: ["COORDINATOR"],
	},
	{
		name: "Cargas Académicas",
		to: "academic-loads",
		roles: ["COORDINATOR"],
	},
	{
		name: "Estudiantes",
		to: "students",
		roles: ["COORDINATOR"],
	},
	{
		name: "Representantes",
		to: "representatives",
		roles: ["COORDINATOR"],
	},
	{
		name: "Representaciones",
		to: "representations",
		roles: ["COORDINATOR"],
	},
	{
		name: "Inscripciones",
		to: "enrollments",
		roles: ["COORDINATOR"],
	},
	{
		name: "Estudiantes por Sección",
		to: "students-by-section",
		roles: ["COORDINATOR"],
	},
	{
		name: "Evaluaciones",
		to: "assignments",
		roles: ["COORDINATOR", "TEACHER"],
	},
	{
		name: "Notas",
		to: "grades",
		roles: ["COORDINATOR", "TEACHER", "REPRESENTATIVE"],
	},
	{
		name: "Cambiar Contraseña",
		to: "change-password",
		roles: ["TEACHER"],
	},
];

interface SideBarProps {
	children?: ReactNode;
	isOpen: boolean;
	userRole: RoleName;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function SideBar({
	children,
	isOpen,
	setIsOpen,
	userRole,
}: SideBarProps) {
	const accessableLinks = LINKS.filter((link) =>
		link.roles.includes(userRole)
	);

	return (
		<>
			<div
				className="fixed inset-0 z-20 flex h-screen w-full max-w-xs translate-x-[-100%] flex-col justify-between gap-y-6 overflow-auto border-r bg-white p-6 shadow-sm transition-transform will-change-transform data-[visible=true]:translate-x-0 lg:relative lg:left-0 lg:translate-x-0"
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

							<h1 className="font-heading text-2xl font-medium uppercase text-gray-700">
								Santa Marta
							</h1>
						</div>

						<button
							className="self-end p-2 text-gray-900 lg:hidden"
							onClick={() => setIsOpen(false)}
						>
							<XMarkIcon className="h-6 w-6" />

							<span className="sr-only">Cerrar menú</span>
						</button>
					</div>

					<nav>
						<ul className="flex flex-col gap-y-2">
							{accessableLinks.map((link) => (
								<li key={link.to}>
									<NavLink
										className="block rounded-md px-6 py-2 font-medium text-gray-700 transition-colors hover:text-blue-500 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-500"
										to={link.to}
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
				className="invisible fixed inset-0 z-10 bg-gray-900/30 aria-expanded:visible lg:aria-expanded:invisible"
				onClick={() => setIsOpen(false)}
			/>
		</>
	);
}
