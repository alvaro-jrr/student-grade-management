import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const action = async ({ params, request }: ActionArgs) => {
	await requireUserWithRole(request, ["ADMIN"]);

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
