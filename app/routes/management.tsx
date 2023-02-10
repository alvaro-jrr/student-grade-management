import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import SideBar from "~/components/sidebar";
import User from "~/components/user";
import { getUser, requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request);
	const user = await getUser(request);

	return json({ user });
};

export default function ManagementIndex() {
	const data = useLoaderData<typeof loader>();
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

	return (
		<div className="flex flex-row">
			<SideBar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen}>
				{data.user ? <User user={data.user} /> : null}
			</SideBar>

			<div className="min-h-screen flex-1 p-6">
				<Outlet context={[isMenuOpen, setIsMenuOpen]} />
			</div>
		</div>
	);
}
