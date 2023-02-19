import { isBefore, isAfter } from "date-fns";
import { db } from "./db.server";

type AcademicPeriodForm = {
	startDate: Date;
	endDate: Date;
};

async function validateAcademicPeriod({
	startDate,
	endDate,
	id,
}: AcademicPeriodForm & { id?: number }) {
	// In case endDate is before startDate
	if (isBefore(endDate, startDate)) {
		throw "La fecha de fin del periodo debe ser después de la fecha de inicio";
	}
	// In case there's more than 1 year of difference
	const startDateYear = startDate.getFullYear();
	const endDateYear = endDate.getFullYear();

	if (endDateYear - startDateYear !== 1) {
		throw "La fecha de fin debe ocurrir en el año siguiente a la fecha de inicio";
	}

	// Find every academic period (omits the one that matches its id if present)
	const academicPeriods = await db.academicPeriod.findMany({
		select: { startDate: true, endDate: true },
		where: id ? { NOT: { id } } : undefined,
	});

	// Verify if period is available
	const isAvailable = academicPeriods.every((academicPeriod) => {
		return (
			isAfter(startDate, academicPeriod.endDate) &&
			isBefore(endDate, academicPeriod.startDate)
		);
	});

	if (!isAvailable) {
		throw "El periodo seleccionado no se encuentra disponible";
	}
}

export async function createAcademicPeriod(academicPeriod: AcademicPeriodForm) {
	try {
		await validateAcademicPeriod(academicPeriod);

		return await db.academicPeriod.create({
			data: {
				startDate: academicPeriod.startDate,
				endDate: academicPeriod.endDate,
			},
		});
	} catch (error) {
		throw error;
	}
}

export async function updateAcademicPeriod(
	academicPeriod: AcademicPeriodForm & { id: number }
) {
	try {
		await validateAcademicPeriod(academicPeriod);

		return await db.academicPeriod.update({
			where: { id: academicPeriod.id },
			data: academicPeriod,
		});
	} catch (error) {
		throw error;
	}
}
