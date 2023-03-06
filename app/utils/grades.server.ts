import type { AcademicPeriod, Course, Student } from "@prisma/client";
import { db } from "./db.server";

const MAX_SCORE = 20;
const MAX_WEIGHT = 100;

type GetCourseFinalScore = {
	courseId: Course["id"];
	studentIdentityCard: Student["identityCard"];
	academicPeriodId: AcademicPeriod["id"];
};

export function total(numbers: number[]) {
	return numbers.reduce((prev, curr) => prev + curr, 0);
}

export function average(numbers: number[]) {
	if (!numbers.length) return 0;

	return total(numbers) / numbers.length;
}

export function calculateAssignmentGrade({
	weight,
	score,
}: {
	weight: number;
	score: number;
}) {
	return (score * weight) / MAX_SCORE;
}

export async function getCourseFinalScoreByLapse({
	courseId,
	studentIdentityCard,
	academicPeriodId,
}: GetCourseFinalScore) {
	// Get lapses
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
		},
	});

	const scoreByLapse: { [lapse: number]: number } = {};

	// Group by lapse
	for (const lapse of lapses) {
		// Get lapse grades from that student-course-period
		const lapseGrades = await db.grade.findMany({
			where: {
				studentIdentityCard,
				assignment: {
					academicLoad: {
						academicPeriodId,
						courseId,
					},
					lapseId: lapse.id,
				},
			},
			select: {
				score: true,
				assignment: {
					select: {
						weight: true,
					},
				},
			},
		});

		// Calculate lapse final score
		const lapseScores = lapseGrades.map(
			({ score, assignment: { weight } }) => {
				return calculateAssignmentGrade({ weight, score });
			}
		);

		scoreByLapse[lapse.id] = (total(lapseScores) * MAX_SCORE) / MAX_WEIGHT;
	}

	return scoreByLapse;
}

export async function getCourseFinalScore({
	courseId,
	studentIdentityCard,
	academicPeriodId,
}: GetCourseFinalScore) {
	// Get student grades from that course in that period
	const courseFinalScoreByLapse = await getCourseFinalScoreByLapse({
		courseId,
		studentIdentityCard,
		academicPeriodId,
	});

	const lapseFinalScores: number[] = [];

	// Get scores
	for (const lapse in courseFinalScoreByLapse) {
		lapseFinalScores.push(courseFinalScoreByLapse[lapse]);
	}

	return Math.round(average(lapseFinalScores));
}
