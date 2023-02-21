import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "./db.server";

type LoginForm = {
	username: string;
	password: string;
};

type RegisterForm = {
	username: string;
	identityCard: string;
	password: string;
};

export async function login({ username, password }: LoginForm) {
	const user = await db.user.findUnique({
		where: { username },
		select: { id: true, password: true },
	});

	if (!user) return null;

	const isCorrectPassword = await bcrypt.compare(password, user.password);

	if (!isCorrectPassword) return null;

	return { id: user.id, username };
}

export async function register({
	username,
	identityCard,
	password,
}: RegisterForm) {
	// Get person
	const person = await db.person.findUnique({
		where: { identityCard },
		select: { role: true },
	});

	if (!person) return null;

	// In case an student tries to register
	if (person.role === "STUDENT") return null;

	// Get role id
	const role = await db.role.findUnique({
		where: { name: person.role },
		select: { id: true },
	});

	// Role isn't stored
	if (role === null) return null;

	const passwordHash = await bcrypt.hash(password, 10);

	// Create user
	const user = await db.user.create({
		data: {
			username,
			password: passwordHash,
			identityCard,
			roleId: role.id,
		},
	});

	return { id: user.id, username };
}

export async function isIdentityCardStored(identityCard: string) {
	return Boolean(await db.person.findUnique({ where: { identityCard } }));
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

export async function getUser(request: Request) {
	const userId = await getUserId(request);

	if (typeof userId !== "number") return null;

	try {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { id: true, username: true },
		});

		return user;
	} catch {
		throw logout(request);
	}
}

export async function logout(request: Request) {
	const session = await getUserSession(request);

	return redirect("/login", {
		headers: {
			"Set-Cookie": await storage.destroySession(session),
		},
	});
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
