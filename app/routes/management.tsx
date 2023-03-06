import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import SideBar from "~/components/sidebar";
import User from "~/components/user";
import { requireUser } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	const user = await requireUser(request);

	return json({ user });
};

export default function ManagementIndex() {
	const data = useLoaderData<typeof loader>();
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

	return (
		<div className="flex flex-row">
			<SideBar
				userRole={data.user.role}
				isOpen={isMenuOpen}
				setIsOpen={setIsMenuOpen}
			>
				<User user={data.user} />
			</SideBar>

			<Outlet context={[isMenuOpen, setIsMenuOpen]} />
		</div>
	);
}
