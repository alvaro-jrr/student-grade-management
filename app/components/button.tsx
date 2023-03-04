import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from "react";
import { forwardRef } from "react";
import { AnchorOrLink } from "./anchor-or-link";

const baseClasses =
	"inline-flex relative rounded-full font-medium focus:outline-none disabled:hover:cursor-not-allowed";

const variantsLookup = {
	primary:
		"text-white bg-blue-500 hover:bg-blue-700 disabled:text-gray-700 disabled:bg-gray-200 focus:bg-blue-700",
	secondary:
		"text-blue-500 border border-blue-300 hover:bg-blue-50 focus:border-blue-400 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 focus:ring-2 focus:ring-blue-200",
	text: "text-blue-500 hover:bg-blue-50 disabled:text-gray-500 disabled:hover:bg-gray-100",
	danger: "text-red-500 border border-red-300 hover:bg-red-50 focus:border-red-400 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 focus:ring-2 focus:ring-red-200",
};

const sizesLookup = {
	small: "px-4 h-9 text-xs",
	medium: "px-6 h-11 text-sm",
	large: "px-8 h-[3.25rem]",
};

const widthLookup = {
	full: "w-full",
	fit: "w-fit",
};

type ButtonVariant = keyof typeof variantsLookup;
type ButtonSize = keyof typeof sizesLookup;
type ButtonWidth = keyof typeof widthLookup;

interface ButtonProps {
	children: JSX.Element | string;
	Icon?: React.ForwardRefExoticComponent<
		React.SVGProps<SVGSVGElement> & {
			title?: string | undefined;
			titleId?: string | undefined;
		}
	>;
	size?: ButtonSize;
	variant?: ButtonVariant;
	width?: ButtonWidth;
}

function ButtonInner({
	children,
	Icon,
}: Pick<ButtonProps, "children" | "Icon">) {
	return (
		<div className="relative flex h-full w-full items-center justify-center gap-x-2 whitespace-nowrap">
			<span>{children}</span>

			{Icon ? (
				<Icon
					aria-hidden="false"
					focusable="false"
					className="h-6 w-6"
				/>
			) : null}
		</div>
	);
}

function Button({
	children,
	variant = "primary",
	size = "medium",
	width = "fit",
	Icon,
	...rest
}: ButtonProps & Omit<ComponentPropsWithoutRef<"button">, "className">) {
	return (
		<button
			{...rest}
			className={`${baseClasses} ${variantsLookup[variant]} ${sizesLookup[size]} ${widthLookup[width]}`}
		>
			<ButtonInner Icon={Icon}>{children}</ButtonInner>
		</button>
	);
}

/**
 * A link that looks like a button
 */
const ButtonLink = forwardRef<
	HTMLAnchorElement,
	ComponentPropsWithRef<typeof AnchorOrLink> & ButtonProps
>(function ButtonLink(
	{
		children,
		variant = "primary",
		size = "medium",
		width = "fit",
		Icon,
		...rest
	},
	ref
) {
	return (
		<AnchorOrLink
			className={`${baseClasses} ${variantsLookup[variant]} ${sizesLookup[size]} ${widthLookup[width]}`}
			ref={ref}
			{...rest}
		>
			<ButtonInner Icon={Icon}>{children}</ButtonInner>
		</AnchorOrLink>
	);
});

export { Button, ButtonLink };
