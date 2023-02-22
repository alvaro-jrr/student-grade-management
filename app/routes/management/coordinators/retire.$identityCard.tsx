import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const action = async ({ params }: ActionArgs) => {
	const identityCard = params.identityCard;

	if (!identityCard) return null;

	await db.coordinator.update({
		where: { identityCard },
		data: {
			retirementDate: new Date(),
			isActive: false,
		},
	});

	return null;
};

export const loader = async () => redirect("/management/coordinators");
