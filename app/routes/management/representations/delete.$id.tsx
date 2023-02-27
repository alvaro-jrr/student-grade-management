import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const action = async ({ params }: ActionArgs) => {
	const id = Number(params.id);

	await db.representativeByStudent.delete({
		where: { id },
	});

	return null;
};

export const loader = () => redirect("/management/representations");
