import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import StudentCard from "~/components/student-card";
import { db } from "~/utils/db.server";

export const loader = async ({ params }: LoaderArgs) => {
	const identityCard = params.identityCard;

	const student = await db.student.findUnique({
		where: { identityCard },
		select: {
			birthDate: true,
			identityCard: true,
			person: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
			representatives: {
				select: {
					representative: {
						select: {
							person: {
								select: {
									firstname: true,
									lastname: true,
								},
							},
							phoneNumber: true,
						},
					},
				},
			},
		},
	});

	if (!student) {
		throw new Response("Estudiante no ha sido encontrado", {
			status: 404,
		});
	}

	return json({
		representatives: student.representatives.map(({ representative }) => ({
			firstname: representative.person.firstname,
			lastname: representative.person.lastname,
			phoneNumber: representative.phoneNumber,
		})),
		student: {
			identityCard: student.identityCard,
			birthDate: format(new Date(student.birthDate), "dd/MM/yyyy"),
			firstname: student.person.firstname,
			lastname: student.person.lastname,
		},
	});
};

export default function StudentRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex h-full items-center justify-center">
			<StudentCard
				student={data.student}
				representatives={data.representatives}
			/>
		</div>
	);
}
