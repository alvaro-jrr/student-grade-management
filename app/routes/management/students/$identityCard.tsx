import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import StudentCard from "~/components/student-card";
import { db } from "~/utils/db.server";
import { dateFormat } from "~/utils/utils";

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

	return json({
		representatives: student
			? student.representatives.map(({ representative }) => ({
					firstname: representative.person.firstname,
					lastname: representative.person.lastname,
					phoneNumber: representative.phoneNumber,
			  }))
			: null,
		student: student
			? {
					identityCard: student.identityCard,
					birthDate: dateFormat(student.birthDate),
					firstname: student.person.firstname,
					lastname: student.person.lastname,
			  }
			: null,
	});
};

export default function StudentRoute() {
	const data = useLoaderData<typeof loader>();

	if (!data.student || !data.representatives) return <p>Not found</p>;

	return (
		<div className="flex h-full items-center justify-center">
			<StudentCard
				student={data.student}
				representatives={data.representatives}
			/>
		</div>
	);
}