import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonLink } from "~/components/button";
import StatCard from "~/components/stat-card";
import { H2, H3, Paragraph } from "~/components/typography";
import { db } from "~/utils/db.server";

export const loader = async () => {
	// Get counters
	const studentsCount = await db.student.count();
	const coursesCount = await db.course.count();
	const teachersCount = await db.course.count();

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
			<header className="flex flex-col gap-y-6 py-28 md:gap-y-8">
				<div className="flex flex-col gap-y-4 lg:text-center">
					<H2>Educación de calidad para todos</H2>

					<Paragraph size="large">
						Contamos con el mejor personal docente y las mejores
						áreas para ofrecer un mejor futuro para tus hijos
					</Paragraph>
				</div>

				<div className="flex flex-col gap-4 md:flex-row lg:justify-center">
					<ButtonLink>Conocer más</ButtonLink>

					<ButtonLink variant="secondary">
						Explorar asignaturas
					</ButtonLink>
				</div>
			</header>

			<section className="grid grid-cols-[repeat(auto-fit,_minmax(18.75rem,_1fr))] gap-4">
				{data.stats.map((stat) => (
					<StatCard
						key={stat.name}
						name={stat.name}
						stat={stat.count}
					/>
				))}
			</section>
		</>
	);
}
