import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

interface UserProps {
	user: {
		username: string;
	};
}

export default function User({ user }: UserProps) {
	return (
		<div className="flex items-center p-2 rounded-md gap-x-4">
			<form action="/logout" method="post">
				<button
					className="p-2 transition-opacity text-slate-600 hover:opacity-80"
					title="Cerrar sesión"
					type="submit"
				>
					<ArrowLeftOnRectangleIcon className="w-6 h-6" />

					<span className="sr-only">Cerrar sesión</span>
				</button>
			</form>

			<div className="space-y-1">
				<p className="font-medium text-slate-600">@{user.username}</p>
			</div>
		</div>
	);
}
