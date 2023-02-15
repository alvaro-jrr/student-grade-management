import { useNavigate } from "@remix-run/react";
import { Button } from "~/components/button";

export default function NewAcademicPeriodRoute() {
	const navigate = useNavigate();

	return (
		<Button type="button" variant="secondary" onClick={() => navigate(-1)}>
			Cancelar
		</Button>
	);
}
