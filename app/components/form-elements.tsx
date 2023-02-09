import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";

export interface FormFieldProps {
	children: JSX.Element;
	error?: string;
	label: string;
	name: string;
	optional?: boolean;
	supportingText?: string;
}

const fieldClasses =
	"min-h-[40px] w-full px-4 border border-gray-300 rounded-md text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500  focus:outline-none aria-[invalid=true]:focus:border-red-500 aria-[invalid=true]:focus:ring-red-500";

function FormField({
	children,
	error,
	label,
	name,
	supportingText,
	optional = false,
}: FormFieldProps) {
	return (
		<div className="flex w-full flex-col gap-y-1">
			<label className="flex justify-between" htmlFor={name}>
				<span className="font-medium text-slate-700">{label}</span>

				{optional ? (
					<span className="text-slate-500">Opcional</span>
				) : null}
			</label>

			{supportingText ? (
				<p className="text-sm text-slate-500">{supportingText}</p>
			) : null}

			{children}

			{error && (
				<span className="text-sm text-red-500" role="alert">
					{error}
				</span>
			)}
		</div>
	);
}

type TextFieldProps = ComponentPropsWithoutRef<"input"> &
	Omit<FormFieldProps, "children">;

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	(
		{
			autoComplete = "off",
			label,
			name,
			type = "text",
			error,
			optional,
			supportingText,
			...rest
		},
		ref
	) => {
		return (
			<FormField
				label={label}
				name={name}
				optional={optional}
				error={error}
				supportingText={supportingText}
			>
				<input
					aria-invalid={Boolean(error)}
					autoComplete={autoComplete}
					className={fieldClasses}
					id={name}
					name={name}
					ref={ref}
					type={type}
					{...rest}
				/>
			</FormField>
		);
	}
);

TextField.displayName = "TextField";

export { TextField };
