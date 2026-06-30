import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El proxy (antes "middleware") intercepta también las rutas /api para
    // comprobar la sesión, y por defecto solo bufferiza los primeros 10MB del
    // cuerpo de la petición (truncando el resto en silencio, sin error). Lo
    // subimos por encima de MAX_FILE_SIZE para que la subida de adjuntos
    // (fotos/documentos) nunca llegue truncada a la ruta de la API.
    proxyClientMaxBodySize: "15mb",
  },
};

export default nextConfig;
