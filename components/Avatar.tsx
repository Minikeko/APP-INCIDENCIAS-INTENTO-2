"use client";

import { useState } from "react";

interface AvatarProps {
  userId: string;
  nombre: string;
  size?: number; // px
  className?: string;
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function colorDeNombre(nombre: string): string {
  const colores = [
    "#e05c5c", "#e0875c", "#d4c25c", "#6db36d",
    "#5c9ee0", "#7b5ce0", "#c05ce0", "#5cc0b3",
  ];
  let hash = 0;
  for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) % colores.length;
  return colores[Math.abs(hash) % colores.length];
}

export function Avatar({ userId, nombre, size = 32, className = "" }: AvatarProps) {
  const [errorImg, setErrorImg] = useState(false);
  const bg = colorDeNombre(nombre);
  const fontSize = Math.max(10, Math.round(size * 0.38));

  if (errorImg) {
    return (
      <div
        className={`rounded-full flex items-center justify-center shrink-0 font-semibold select-none ${className}`}
        style={{ width: size, height: size, backgroundColor: bg, fontSize, color: "#fff" }}
      >
        {iniciales(nombre)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/usuario/avatar/${userId}`}
      alt={nombre}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setErrorImg(true)}
    />
  );
}
