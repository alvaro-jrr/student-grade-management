import { format, getYear, isSameYear, isWithinInterval } from "date-fns";
import { db } from "./db.server";

export const findActiveAcademicPeriod = async () => {
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
};

export const getAcademicPeriodRange = (start: Date, end: Date) =>
	`${getYear(start)}-${getYear(end)}`;

export const dateFormat = (date: Date) => format(date, "dd/MM/yyyy");
