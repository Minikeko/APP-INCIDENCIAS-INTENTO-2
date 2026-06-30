import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Esta comprobación es una capa extra de protección a nivel de página.
  // La verificación real y obligatoria ya ocurre en cada ruta /api/* con
  // requireAdmin(), así que aunque alguien accediera aquí sin ser admin,
  // las llamadas a la API seguirían bloqueadas.
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
