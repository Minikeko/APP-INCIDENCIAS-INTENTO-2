import { NextResponse } from "next/server";

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tienes permiso para esta acción" },
        { status: 403 }
      );
    }
  }
  console.error(error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
