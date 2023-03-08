import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import StatCard from "~/components/stat-card";
import { H2, H3, H4, Paragraph } from "~/components/typography";
import { db } from "~/utils/db.server";

export const loader = async () => {
	// Get counters
	const studentsCount = await db.student.count();
	const coursesCount = await db.course.count();
	const teachersCount = await db.teacher.count();

	return json({
		stats: [
			{ name: "Estudiantes", count: studentsCount },
			{ name: "Asignaturas", count: coursesCount },
			{ name: "Docentes", count: teachersCount },
		],
	});
};

export default function IndexRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<section className="flex flex-col gap-y-6 py-28 md:gap-y-8">
				<div className="flex flex-col gap-y-4 lg:text-center">
					<H2>Educación de calidad para todos</H2>

					<Paragraph size="large">
						Contamos con el mejor personal docente y las mejores
						áreas para ofrecer un mejor futuro para tus hijos
					</Paragraph>
				</div>

				<div className="flex flex-col gap-4 md:flex-row lg:justify-center">
					<ButtonLink to="#about-us">Conocer más</ButtonLink>

					<ButtonLink to="/register" variant="secondary">
						Registrarse
					</ButtonLink>
				</div>
			</section>

			<section className="grid grid-cols-[repeat(auto-fit,_minmax(18.75rem,_1fr))] gap-4">
				{data.stats.map((stat) => (
					<StatCard
						key={stat.name}
						name={stat.name}
						stat={stat.count}
					/>
				))}
			</section>

			<section className="my-6 space-y-4">
				<H3 id="about-us">Sobre Nosotros</H3>

				<div className="grid  gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<H4>Misión</H4>

						<Paragraph>
							El liceo santa marta se encarga de formar a sus
							estudiantes para volverlos futuros bachilleres y de
							reforzar valores para que puedan desempeñarse en la
							sociedad de forma adecuada.
						</Paragraph>
					</div>

					<div className="space-y-2">
						<H4>Visión</H4>

						<Paragraph>
							Brindar a todo el personal tanto docente y a la
							población estudiantil la mejor experiencia dentro de
							nuestra institución con todos los recursos que
							disponemos tomando en cuenta las opiniones de cada
							uno en cuanto a que aspecto se puede mejorar dentro
							de la institución.
						</Paragraph>
					</div>
				</div>

				<div className="space-y-2">
					<H4>Valores Institucionales</H4>

					<ul className="list-inside list-disc text-gray-500 marker:text-blue-500">
						<li>Tolerancia</li>
						<li>Responsabilidad</li>
						<li>Honestidad</li>
						<li>Justicia</li>
						<li>Compañerismo</li>
					</ul>
				</div>
			</section>
		</>
	);
}
