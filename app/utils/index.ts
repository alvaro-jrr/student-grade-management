import { getYear } from "date-fns";

export function academicPeriodInterval(
	start: Date | string,
	end: Date | string
) {
	const startDate = start instanceof Date ? start : new Date(start);
	const endDate = end instanceof Date ? end : new Date(end);

	return `${getYear(startDate)}-${getYear(endDate)}`;
}
