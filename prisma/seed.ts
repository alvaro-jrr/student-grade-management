import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
	// Create study years (1 to 5)
	for (let year = 1; year <= 5; year++) {
		await prisma.studyYear.create({ data: { year } });
	}

	// Create lapses
	for (let lapse = 1; lapse <= 3; lapse++) {
		await prisma.lapse.create({ data: { description: lapse } });
	}

	await prisma.user.create({
		data: {
			username: "alvarojrr",
			identityCard: "28385587",
			role: "ADMIN",
			// Paris.2022 hashed
			password:
				"$2a$10$c3.M5h0wtX1rXwehx3TazOyUKZqV32/xYXgphuPECRi.6ZzCrbCxK",
		},
	});
}

seed()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
