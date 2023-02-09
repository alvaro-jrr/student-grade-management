import { H4, Paragraph } from "./typography";

interface StatCardProps {
	name: string;
	stat: string | number;
}

export default function StatCard({ name, stat }: StatCardProps) {
	return (
		<div
			className="flex w-full flex-col gap-y-4 rounded-md border p-6 shadow-sm transition-shadow hover:shadow-md"
			key={name}
		>
			<H4 as="span">{name}</H4>

			<Paragraph size="large">
				<span className="font-mono">{stat}</span>
			</Paragraph>
		</div>
	);
}
