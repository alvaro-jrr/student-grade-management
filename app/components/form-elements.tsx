import type { ComponentPropsWithoutRef } from "react";
import type { Value } from "react-phone-number-input";
import { forwardRef } from "react";
import PhoneInput from "react-phone-number-input";
import { PhoneIcon } from "@heroicons/react/24/outline";

export interface FormFieldProps {
	children: JSX.Element;
	error?: string;
	label: string;
	name: string;
	optional?: boolean;
	supportingText?: string;
}

const fieldClasses =
	"min-h-[40px] w-full bg-white px-4 border border-gray-300 rounded-md text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500  focus:outline-none aria-[invalid=true]:focus:border-red-500 aria-[invalid=true]:focus:ring-red-500";

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

type PhoneFieldProps = Omit<
	TextFieldProps,
	"onChange" | "value" | "type" | "defaultValue"
> & {
	onChange: (value?: Value) => void;
	value?: Value;
	defaultValue?: Value;
};

export default function PhoneField({
	autoComplete = "off",
	label,
	name,
	error,
	optional,
	supportingText,
	value,
	onChange,
	...rest
}: PhoneFieldProps) {
	return (
		<FormField error={error} label={label} name={name}>
			<PhoneInput
				autoComplete={autoComplete}
				aria-invalid={Boolean(error)}
				className="flex gap-x-2"
				international
				defaultCountry="VE"
				countryCallingCodeEditable={false}
				internationalIcon={() => (
					<PhoneIcon className="h-4 w-4 text-gray-700" />
				)}
				numberInputProps={{
					className: fieldClasses,
				}}
				countrySelectProps={{
					unicodeFlags: true,
				}}
				value={value}
				onChange={onChange}
				id={name}
				name={name}
				{...rest}
			/>
		</FormField>
	);
}

type SelectProps = ComponentPropsWithoutRef<"select"> &
	Omit<FormFieldProps, "children"> & {
		options: { name: string | number; value: string | number }[];
	};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			label,
			name,
			error,
			optional,
			supportingText,
			options,
			placeholder,
			...rest
		},
		ref
	) => {
		return (
			<FormField
				label={label}
				name={name}
				error={error}
				optional={optional}
				supportingText={supportingText}
			>
				<select
					name={name}
					className={fieldClasses}
					ref={ref}
					{...rest}
				>
					<option value="">
						{placeholder ? placeholder : "Seleccione una opción"}
					</option>

					{options.map((option) => (
						<option value={option.value} key={option.value}>
							{option.name}
						</option>
					))}
				</select>
			</FormField>
		);
	}
);

Select.displayName = "Select";

export { TextField, Select };
