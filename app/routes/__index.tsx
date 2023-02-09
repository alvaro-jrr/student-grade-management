import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import NavBar from "~/components/navbar";
import { getUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	return json({
		isUserLoggedIn: typeof (await getUserId(request)) === "number",
	});
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="grid min-h-screen grid-rows-[auto_1fr]">
			<NavBar isLoggedIn={data.isUserLoggedIn} />

			<div className="mx-[10vw]">
				<Outlet />
			</div>
		</div>
	);
}
