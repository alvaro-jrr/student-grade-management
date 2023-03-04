import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserWithRole } from "~/utils/session.server";

export const action = async ({ params, request }: ActionArgs) => {
	await requireUserWithRole(request, ["COORDINATOR"]);

	const id = Number(params.id);

	await db.representativeByStudent.delete({
		where: { id },
	});

	return null;
};

export const loader = () => redirect("/management/representations");
