import type {
	AcademicPeriod,
	Course,
	Student,
	StudyYear,
} from "@prisma/client";
import { db } from "./db.server";

const MAX_SCORE = 20;
const MAX_WEIGHT = 100;

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

type GetStudyYearFinalGrade = {
	studentIdentityCard: Student["identityCard"];
	studyYearId: StudyYear["id"];
	academicPeriodId: AcademicPeriod["id"];
};

export async function getStudyYearFinalGrade({
	studentIdentityCard,
	studyYearId,
	academicPeriodId,
}: GetStudyYearFinalGrade) {
	const courses = await db.course.findMany({
		where: {
			studyYears: {
				some: {
					studyYearId,
				},
			},
		},
		select: {
			id: true,
		},
	});

	const finalGrades: number[] = [];

	for (const course of courses) {
		const finalGrade = await getCourseFinalGrade({
			courseId: course.id,
			academicPeriodId,
			studentIdentityCard,
		});

		finalGrades.push(finalGrade);
	}

	return average(finalGrades);
}

export type FinalGrade = {
	academicPeriod: Pick<AcademicPeriod, "id" | "startDate" | "endDate">;
	studyYear: StudyYear;
	grade: number;
};

export async function getAllFinalGrades(
	studentIdentityCard: Student["identityCard"]
) {
	// Get student
	const student = await db.student.findUnique({
		where: {
			identityCard: studentIdentityCard,
		},
		select: {
			enrollments: {
				select: {
					academicPeriod: {
						select: {
							id: true,
							startDate: true,
							endDate: true,
						},
					},
					studyYear: true,
				},
			},
		},
	});

	// Store scores
	const finalGrades: FinalGrade[] = [];

	if (!student) return finalGrades;

	for (const enrollment of student.enrollments) {
		const finalGrade = await getStudyYearFinalGrade({
			studentIdentityCard,
			studyYearId: enrollment.studyYear.id,
			academicPeriodId: enrollment.academicPeriod.id,
		});

		finalGrades.push({
			academicPeriod: enrollment.academicPeriod,
			studyYear: enrollment.studyYear,
			grade: finalGrade,
		});
	}

	return finalGrades;
}

interface GetStudyYearFinalGrades
	extends Omit<GetCourseFinalGrade, "courseId"> {
	studyYearId: StudyYear["id"];
}

export async function getStudyYearFinalGrades({
	studyYearId,
	studentIdentityCard,
	academicPeriodId,
}: GetStudyYearFinalGrades) {
	// Get courses
	const courses = await db.course.findMany({
		where: {
			studyYears: {
				some: {
					studyYearId,
				},
			},
		},
		select: {
			id: true,
		},
	});

	const coursesFinalGrade: { [courseId: number]: number } = {};

	// Get score by course
	for (const course of courses) {
		coursesFinalGrade[course.id] = await getCourseFinalGrade({
			courseId: course.id,
			studentIdentityCard,
			academicPeriodId,
		});
	}

	return coursesFinalGrade;
}

export async function getStudyYearGradeAverage({
	studyYearId,
	studentIdentityCard,
	academicPeriodId,
}: GetStudyYearFinalGrades) {
	const coursesFinalGrade = await getStudyYearFinalGrades({
		studyYearId,
		studentIdentityCard,
		academicPeriodId,
	});

	// Get scores
	const finalGrades: number[] = [];

	for (const finalGrade in coursesFinalGrade) {
		finalGrades.push(coursesFinalGrade[finalGrade]);
	}

	return finalGrades;
}

export async function isStudentApproved({
	studyYearId,
	studentIdentityCard,
	academicPeriodId,
}: GetStudyYearFinalGrades) {
	const coursesFinalScore = await getStudyYearFinalGrades({
		studyYearId,
		studentIdentityCard,
		academicPeriodId,
	});

	// Get scores
	const finalGrades: number[] = [];

	for (const finalGrade in coursesFinalScore) {
		finalGrades.push(coursesFinalScore[finalGrade]);
	}

	return finalGrades.every((score) => score >= 10);
}

interface GetCourseFinalGrade {
	courseId: Course["id"];
	studentIdentityCard: Student["identityCard"];
	academicPeriodId: AcademicPeriod["id"];
}

export type StudyYearGrade = {
	course: {
		id: number;
		title: string;
	};
	lapse: {
		first: number;
		second: number;
		third: number;
	};
};

export async function getStudyYearGrades({
	studyYearId,
	studentIdentityCard,
	academicPeriodId,
}: GetStudyYearFinalGrade) {
	const courses = await db.course.findMany({
		where: {
			studyYears: {
				some: {
					studyYearId,
				},
			},
		},
		select: {
			id: true,
			title: true,
		},
	});

	const gradesByCourse: StudyYearGrade[] = [];

	// Assign grade of each course
	for (const course of courses) {
		const courseGradeByLapse = await getCourseFinalGradeByLapse({
			courseId: course.id,
			academicPeriodId,
			studentIdentityCard,
		});

		// Add value
		gradesByCourse.push({
			course,
			lapse: {
				first: courseGradeByLapse[1],
				second: courseGradeByLapse[2],
				third: courseGradeByLapse[3],
			},
		});
	}

	return gradesByCourse;
}

export async function getCourseFinalGradeByLapse({
	courseId,
	studentIdentityCard,
	academicPeriodId,
}: GetCourseFinalGrade) {
	// Get lapses
	const lapses = await db.lapse.findMany({
		select: {
			id: true,
		},
	});

	const gradeByLapse: { [lapse: number]: number } = {};

	// Group by lapse
	for (const lapse of lapses) {
		// Get lapse grades from that student-course-period
		const lapseGrades = await db.grade.findMany({
			where: {
				studentIdentityCard,
				assignment: {
					academicLoad: {
						academicPeriodId,
						courseByStudyYear: {
							courseId,
						},
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
		const lapseFinalGrades = lapseGrades.map(
			({ score, assignment: { weight } }) => {
				return calculateAssignmentGrade({ weight, score });
			}
		);

		gradeByLapse[lapse.id] =
			(total(lapseFinalGrades) * MAX_SCORE) / MAX_WEIGHT;
	}

	return gradeByLapse;
}

export async function getCourseFinalGrade({
	courseId,
	studentIdentityCard,
	academicPeriodId,
}: GetCourseFinalGrade) {
	// Get student grades from that course in that period
	const courseFinalGradeByLapse = await getCourseFinalGradeByLapse({
		courseId,
		studentIdentityCard,
		academicPeriodId,
	});

	const lapseFinalGrades: number[] = [];

	// Get scores
	for (const lapse in courseFinalGradeByLapse) {
		lapseFinalGrades.push(courseFinalGradeByLapse[lapse]);
	}

	return Math.round(average(lapseFinalGrades));
}
