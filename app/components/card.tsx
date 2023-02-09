import type { ReactNode } from "react";
import { H3, H4, Paragraph } from "./typography";

interface CardHeadingProps {
	title: string;
	subtitle?: string;
	supportingText?: string;
}

const baseClasses =
	"flex flex-col gap-4 border rounded-xl p-6 w-full sm:max-w-sm";

const variantsLookup = {
	elevated: "shadow-lg",
	outlined: "shadow-sm border border-slate-300",
	filled: "bg-blue-50",
};

type CardVariant = keyof typeof variantsLookup;

interface CardProps extends Partial<CardHeadingProps> {
	children: ReactNode;
	variant?: CardVariant;
}

function CardHeading({ title, subtitle, supportingText }: CardHeadingProps) {
	return (
		<div className="space-y-2">
			<div className="space-y-1">
				<H3>{title}</H3>

				{subtitle ? <H4>{subtitle}</H4> : null}
			</div>

			{supportingText ? <Paragraph>{supportingText}</Paragraph> : null}
		</div>
	);
}

export default function Card({
	title,
	subtitle,
	supportingText,
	variant = "outlined",
	children,
}: CardProps) {
	return (
		<div className={`${baseClasses} ${variantsLookup[variant]}`}>
			{title ? (
				<CardHeading
					title={title}
					subtitle={subtitle}
					supportingText={supportingText}
				/>
			) : null}

			{children}
		</div>
	);
}
