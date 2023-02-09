import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "./db.server";

type LoginForm = {
	email: string;
	password: string;
};

export async function login({ email, password }: LoginForm) {
	const user = await db.user.findUnique({
		where: { email },
	});

	if (!user) return null;

	const isCorrectPassword = await bcrypt.compare(password, user.password);

	if (!isCorrectPassword) return null;

	return user;
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) throw new Error("SESSION_SECRET debe ser establecido");

const storage = createCookieSessionStorage({
	cookie: {
		name: "SGM_session",
		secure: process.env.NODE_ENV === "production",
		secrets: [sessionSecret],
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 1 month
		httpOnly: true,
	},
});

function getUserSession(request: Request) {
	return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
	const session = await getUserSession(request);
	const userId = session.get("userId");

	if (!userId || typeof userId !== "number") return null;

	return userId;
}

export async function requireUserId(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const session = await getUserSession(request);
	const userId = session.get("userId");

	if (!userId || typeof userId !== "number") {
		const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
		throw redirect(`/login?${searchParams}`);
	}

	return userId;
}

export async function createUserSession(userId: number, redirectTo: string) {
	const session = await storage.getSession();
	session.set("userId", userId);

	return redirect(redirectTo, {
		headers: {
			"Set-Cookie": await storage.commitSession(session),
		},
	});
}
