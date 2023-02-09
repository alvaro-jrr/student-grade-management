import { Outlet } from "@remix-run/react";
import NavBar from "~/components/navbar";

export default function Index() {
	return (
		<div className="grid min-h-screen grid-rows-[auto_1fr]">
			<NavBar />

			<div className="mx-[10vw]">
				<Outlet />
			</div>
		</div>
	);
}
