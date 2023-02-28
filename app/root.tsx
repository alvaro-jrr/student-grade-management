import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import syne from "@fontsource/syne/variable.css";
import styles from "./styles/app.css";
import phoneInputStyles from "react-phone-number-input/style.css";
import bookIconUrl from "~/assets/book-icon.svg";

export const meta: MetaFunction = () => ({
	charset: "utf-8",
	title: "Liceo Santa Marta",
	viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
	{
		rel: "stylesheet",
		href: styles,
	},
	{
		rel: "stylesheet",
		href: syne,
	},
	{
		rel: "stylesheet",
		href: phoneInputStyles,
	},
	{
		rel: "icon",
		href: bookIconUrl,
	},
];

export default function App() {
	return (
		<html lang="es">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
