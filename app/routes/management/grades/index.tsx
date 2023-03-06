import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserWithRole } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUserWithRole(request, ["COORDINATOR", "TEACHER"]);

	return json({
		user,
	});
};

export default function GradesIndexRoute() {
	return <div className="space-y-6"></div>;
}
