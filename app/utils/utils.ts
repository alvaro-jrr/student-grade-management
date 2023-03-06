import { format, getYear } from "date-fns";
import { db } from "./db.server";

interface LapseGrade {
	[course: number]: {
		[lapse: number]: number[];
	};
}
export function calculateEvaluatedGrade({
	weight,
	score,
}: {
	weight: number;
	score: number;
}) {
	const MAX_SCORE = 20;

	return (score * weight) / MAX_SCORE;
}

export async function getGrades({
	academicPeriodId,
	studentIdentityCard,
	studyYearId,
}: {
	academicPeriodId: number;
	studyYearId: number;
	studentIdentityCard: string;
}) {
	// Get lapses
	const lapses = await db.lapse.findMany({
		select: { id: true },
	});

	// Get courses from study year
	const courses = await db.course.findMany({
		where: {
			studyYearId,
		},
		select: {
			id: true,
		},
	});

	// Get grades from that academic period and study year
	const grades = await db.grade.findMany({
		where: {
			studentIdentityCard,
			assignment: {
				academicLoad: {
					academicPeriodId,
					course: {
						studyYearId,
					},
				},
			},
		},
		select: {
			score: true,
			assignment: {
				select: {
					weight: true,
					lapseId: true,
					academicLoad: {
						select: {
							courseId: true,
						},
					},
				},
			},
		},
	});

	const gradesByCourse: LapseGrade = {};

	// Group by course
	courses.forEach((course) => {
		gradesByCourse[course.id] = {};

		// Group by lapses
		lapses.forEach((lapse) => {
			gradesByCourse[course.id][lapse.id] = [];
		});
	});

	// Assign grades to each course by lapse
	grades.forEach(
		({
			score,
			assignment: {
				lapseId,
				weight,
				academicLoad: { courseId },
			},
		}) => {
			// Add evaluated grade
			gradesByCourse[courseId][lapseId].push(
				calculateEvaluatedGrade({ score, weight })
			);
		}
	);

	return gradesByCourse;
}

export async function getGradesAverageByCourse({
	academicPeriodId,
	studentIdentityCard,
	studyYearId,
}: {
	academicPeriodId: number;
	studyYearId: number;
	studentIdentityCard: string;
}) {
	// Get lapses
	const lapses = await db.lapse.findMany({
		select: { id: true },
	});

	// Get courses from study year
	const courses = await db.course.findMany({
		where: {
			studyYearId,
		},
		select: {
			id: true,
		},
	});

	// Get grades from each course in that period
	const gradesByCourse = await getGrades({
		academicPeriodId,
		studyYearId,
		studentIdentityCard,
	});

	const gradesAverageByCourse: number[] = [];

	// Average by course
	courses.forEach((course, index) => {
		const courseGrades = gradesByCourse[course.id];
		const lapseGradesAverage: number[] = [];

		// Store average by lapse
		lapses.forEach((lapse) => {
			lapseGradesAverage.push(average(courseGrades[lapse.id]));
		});

		gradesAverageByCourse[index] = average(lapseGradesAverage);
	});

	return gradesAverageByCourse;
}

export function totalSum(numbers: number[]) {
	return numbers.reduce((prev, curr) => prev + curr, 0);
}

export function average(numbers: number[]) {
	if (!numbers.length) return 0;

	return totalSum(numbers) / numbers.length;
}

export const getAcademicPeriodRange = (
	start: Date | string,
	end: Date | string
) => {
	const startDate = start instanceof Date ? start : new Date(start);
	const endDate = end instanceof Date ? end : new Date(end);

	return `${getYear(startDate)}-${getYear(endDate)}`;
};

export const dateFormat = (date: Date | string) =>
	format(date instanceof Date ? date : new Date(date), "dd/MM/yyyy");
