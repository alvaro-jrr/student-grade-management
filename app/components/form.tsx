import type { FormSchema, FormProps } from "remix-forms";
import { createForm } from "remix-forms";
import {
	Form as FrameworkForm,
	useActionData,
	useSubmit,
	useTransition as useNavigation,
} from "@remix-run/react";

const RemixForm = createForm({
	component: FrameworkForm,
	useNavigation,
	useSubmit,
	useActionData,
});

function Errors(props: JSX.IntrinsicElements["div"]) {
	return (
		<div
			className="flex flex-col space-y-2 rounded-md bg-red-50 p-2 text-red-500"
			{...props}
		/>
	);
}
function Form<Schema extends FormSchema>(props: FormProps<Schema>) {
	return (
		<RemixForm<Schema>
			className="space-y-6"
			globalErrorsComponent={Errors}
			{...props}
		/>
	);
}

export { Form };
