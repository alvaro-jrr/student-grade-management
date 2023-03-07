import type { RoleName, User } from "@prisma/client";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "./db.server";

interface LoginForm {
	username: string;
	password: string;
}

interface RegisterForm extends LoginForm {
	identityCard: string;
}

export async function login({ username, password }: LoginForm) {
	const user = await db.user.findUnique({
		where: { username },
		select: { id: true, password: true, role: true, identityCard: true },
	});

	// In case user doesn't exist
	if (!user) return null;

	const isCorrectPassword = await bcrypt.compare(password, user.password);

	// In case password doesn't match
	if (!isCorrectPassword) return null;

	if (user.role === "COORDINATOR") {
		const coordinator = await db.coordinator.findUnique({
			where: { identityCard: user.identityCard },
		});

		// In case coordinator isn't active
		if (
			typeof coordinator?.isActive === "boolean" &&
			!coordinator.isActive
		) {
			throw "Coordinador ya no está activo";
		}
	}

	return user.id;
}

interface ChangePasswordForm {
	username: string;
	currentPassword: string;
	newPassword: string;
}

export async function changePassword({
	username,
	currentPassword,
	newPassword,
}: ChangePasswordForm) {
	const user = await db.user.findUnique({
		where: { username },
		select: { id: true, password: true, role: true, identityCard: true },
	});

	// In case user doesn't exist
	if (!user) return null;

	const isCorrectPassword = await bcrypt.compare(
		currentPassword,
		user.password
	);

	// In case password doesn't match
	if (!isCorrectPassword) return null;

	// Hash new password
	const newPasswordHash = await bcrypt.hash(newPassword, 10);

	return await db.user.update({
		where: {
			username,
		},
		data: {
			password: newPasswordHash,
		},
	});
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

	const passwordHash = await bcrypt.hash(password, 10);

	// Create user
	const user = await db.user.create({
		data: {
			username,
			password: passwordHash,
			identityCard,
			role: person.role,
		},
	});

	return { id: user.id, username };
}

export async function isIdentityCardStored(identityCard: string) {
	return Boolean(await db.person.findUnique({ where: { identityCard } }));
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) throw new Error("SESSION_SECRET debe ser establecido");

const sessionStorage = createCookieSessionStorage({
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

const USER_SESSION_KEY = "userId";

export async function createUserSession(userId: number, redirectTo: string) {
	const session = await sessionStorage.getSession();
	session.set(USER_SESSION_KEY, userId);

	return redirect(redirectTo, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session),
		},
	});
}

function getSession(request: Request) {
	return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(
	request: Request
): Promise<User["id"] | undefined> {
	const session = await getSession(request);
	const userId = session.get(USER_SESSION_KEY);

	return userId;
}

export async function getUser(request: Request) {
	const userId = await getUserId(request);

	if (userId === undefined) return null;

	const user = await db.user.findUnique({
		where: { id: userId },
	});

	if (user) return user;

	throw await logout(request);
}

export async function requireUserId(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const userId = await getUserId(request);

	if (!userId) {
		const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
		throw redirect(`/login?${searchParams}`);
	}

	return userId;
}

export async function requireUser(request: Request, redirectTo?: string) {
	const userId = await requireUserId(request, redirectTo);

	const user = await db.user.findUnique({
		where: { id: userId },
	});

	if (user) return user;

	throw await logout(request);
}

export async function requireUserWithRole(request: Request, roles: RoleName[]) {
	const user = await requireUser(request, "/management");

	if (roles.includes(user.role)) return user;

	throw await logout(request);
}

export async function logout(request: Request) {
	const session = await getSession(request);

	return redirect("/login", {
		headers: {
			"Set-Cookie": await sessionStorage.destroySession(session),
		},
	});
}
