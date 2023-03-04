import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
} from "@remix-run/react";
import syne from "@fontsource/syne/variable.css";
import styles from "./styles/app.css";
import phoneInputStyles from "react-phone-number-input/style.css";
import bookIconUrl from "~/assets/book-icon.svg";
import { H1, Paragraph } from "./components/typography";
import Card from "./components/card";
import { ButtonLink } from "./components/button";

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

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<html>
			<head>
				<title>Oops!</title>
				<Meta />
				<Links />
			</head>
			<body className="grid min-h-screen place-items-center">
				<Card
					title="Oops!"
					subtitle={`Ha ocurrido un error ${caught.status}`}
				>
					<Paragraph>{caught.data}</Paragraph>

					<div className="flex justify-end">
						<ButtonLink to="/">Volver a inicio</ButtonLink>
					</div>
				</Card>
				<Scripts />
			</body>
		</html>
	);
}

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
