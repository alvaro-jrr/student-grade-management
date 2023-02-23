import Card from "./card";
import { Paragraph } from "./typography";

interface StudentCardProps {
	student: {
		identityCard: string;
		birthDate: string;
		firstname: string;
		lastname: string;
	};
	representatives: {
		firstname: string;
		lastname: string;
		phones: {
			id: number;
			phoneNumber: string;
		}[];
	}[];
}

function SingleStudentData({ title, value }: { title: string; value: string }) {
	return (
		<div className="flex flex-col py-4 lg:flex-row lg:justify-between">
			<Paragraph>
				<span className="font-medium">{title}</span>
			</Paragraph>

			<Paragraph>{value}</Paragraph>
		</div>
	);
}

type StudentDataType = {
	title: string;
	key: keyof StudentCardProps["student"];
};

const studentData: StudentDataType[] = [
	{
		title: "Cédula de Identidad",
		key: "identityCard",
	},
	{
		title: "Fecha de Nacimiento",
		key: "birthDate",
	},
];

export default function StudentCard({ student }: StudentCardProps) {
	return (
		<Card title={`${student.firstname} ${student.lastname}`}>
			<div className="flex flex-col divide-y-2">
				{studentData.map(({ title, key }) => (
					<SingleStudentData
						key={key}
						title={title}
						value={student[key]}
					/>
				))}
			</div>
		</Card>
	);
}
