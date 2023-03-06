import { isWithinInterval } from "date-fns";
import { db } from "./db.server";

export async function getActiveAcademicPeriod() {
	// Get periods ordered by start date min to max
	const academicPeriods = await db.academicPeriod.findMany({
		select: {
			id: true,
			startDate: true,
			endDate: true,
		},
		orderBy: { startDate: "asc" },
	});

	const currentDate = new Date();

	// Find first where current date is within its interval
	return academicPeriods.find(({ startDate, endDate }) => {
		return isWithinInterval(currentDate, {
			start: startDate,
			end: endDate,
		});
	});
}

export async function getLastAcademicPeriod() {
	// Get periods ordered by start date min to max
	const academicPeriods = await db.academicPeriod.findMany({
		select: {
			id: true,
			startDate: true,
			endDate: true,
		},
		orderBy: { startDate: "desc" },
	});

	const currentDate = new Date();

	// Find first where current date is within its interval
	return academicPeriods.find(({ startDate, endDate }) => {
		return !isWithinInterval(currentDate, {
			start: startDate,
			end: endDate,
		});
	});
}
