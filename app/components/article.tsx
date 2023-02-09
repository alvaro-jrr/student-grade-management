import type { ElementType, ReactNode } from "react";
import { H2 } from "./typography";

interface ArticleProps {
	title: string;
	children: ReactNode;
	as?: ElementType;
}

export default function Article({ as, children, title }: ArticleProps) {
	const Tag = as ?? "article";

	return (
		<Tag className="space-y-6 py-12">
			<H2>{title}</H2>

			<section>{children}</section>
		</Tag>
	);
}
