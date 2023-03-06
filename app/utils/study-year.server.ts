import { db } from "./db.server";
import { findLastAcademicPeriod } from "./academic-period.server";
import { isStudentApproved } from "./grades.server";

export async function apllicableStudyYear(identityCard: string) {
	// Last academic period
	const lastAcademicPeriod = await findLastAcademicPeriod();

	// Last enrollment
	const lastEnrollment = await db.enrollment.findFirst({
		where: { studentIdentityCard: identityCard },
		select: {
			studyYearId: true,
			studyYear: {
				select: {
					id: true,
					year: true,
				},
			},
		},
		orderBy: {
			studyYear: {
				year: "asc",
			},
		},
	});

	// In case there's no last academic period nor previous enrollment, then send 1st year
	if (!lastAcademicPeriod || !lastEnrollment) {
		const firstYear = await db.studyYear.findFirst({
			where: { year: 1 },
			select: {
				id: true,
				year: true,
			},
		});

		return firstYear;
	}

	// Check if student approved last study year
	const isApproved = await isStudentApproved({
		academicPeriodId: lastAcademicPeriod.id,
		studyYearId: lastEnrollment.studyYearId,
		studentIdentityCard: identityCard,
	});

	// In case isn't approved, student has to repeat study year
	if (!isApproved) return lastEnrollment.studyYear;

	// Return next study year
	return await db.studyYear.findFirst({
		where: {
			year: {
				gte: lastEnrollment.studyYear.year,
			},
		},
		select: {
			id: true,
			year: true,
		},
		orderBy: {
			year: "asc",
		},
	});
}
