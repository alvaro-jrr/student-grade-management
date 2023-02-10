import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

interface UserProps {
	user: {
		firstname: string;
		lastname: string;
		email: string;
	};
}

export default function User({ user }: UserProps) {
	return (
		<div className="flex items-center gap-x-4 rounded-md p-2">
			<form action="/logout" method="post">
				<button
					className="p-2 text-slate-600 transition-opacity hover:opacity-80"
					title="Cerrar sesión"
					type="submit"
				>
					<ArrowLeftOnRectangleIcon className="h-6 w-6" />

					<span className="sr-only">Cerrar sesión</span>
				</button>
			</form>

			<div className="space-y-1">
				<p className="font-medium text-slate-600">
					{user.firstname + " " + user.lastname}
				</p>

				<p className="text-sm text-slate-500">{user.email}</p>
			</div>
		</div>
	);
}
