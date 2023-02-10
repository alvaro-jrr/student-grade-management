import type { LoaderArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import SideBar from "~/components/sidebar";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);

	return null;
};

export default function ManagementIndex() {
	return (
		<div className="flex flex-row">
			<SideBar />

			<div className="flex-1 p-6">
				<Outlet />
			</div>
		</div>
	);
}
