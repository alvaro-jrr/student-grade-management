import { ButtonLink } from "./button";
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
		phoneNumber: string;
	}[];
}

function SingleStudentData({ title, value }: { title: string; value: string }) {
	return (
		<div className="flex flex-col lg:flex-row lg:justify-between">
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

export default function StudentCard({
	student,
	representatives,
}: StudentCardProps) {
	return (
		<Card title={`${student.firstname} ${student.lastname}`}>
			<div className="flex flex-col gap-y-4">
				<div className="space-y-2">
					<p className="border-b pb-2 font-semibold text-gray-700">
						Información personal
					</p>

					<div className="flex flex-col gap-y-2">
						{studentData.map(({ title, key }) => (
							<SingleStudentData
								key={key}
								title={title}
								value={student[key]}
							/>
						))}
					</div>
				</div>

				<div className="space-y-2">
					<p className="border-b pb-2 font-semibold text-gray-700">
						Representantes
					</p>

					{representatives.map((representative) => (
						<SingleStudentData
							key={representative.phoneNumber}
							title={`${representative.firstname} ${representative.lastname}`}
							value={representative.phoneNumber}
						/>
					))}
				</div>
			</div>

			<div className="flex justify-end">
				<ButtonLink variant="secondary" to="/management/students">
					Volver
				</ButtonLink>
			</div>
		</Card>
	);
}
