export default function RecursosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-duech-blue mb-12 text-4xl font-bold">Recursos</h1>

      <div className="prose prose-lg max-w-none">
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Sobre el Diccionario</h2>
          <p className="mb-4 text-gray-700">
            El Diccionario de uso del español de Chile (DUECh) es una obra lexicográfica fundamental
            para comprender la riqueza y diversidad del español hablado en Chile.
          </p>
          <p className="text-gray-700">
            Este proyecto de digitalización busca hacer accesible esta invaluable herramienta
            lingüística a todos los hablantes, estudiantes e investigadores del español chileno.
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Características del DUECh</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Documentación exhaustiva de chilenismos y modismos</li>
            <li>Ejemplos de uso real extraídos de fuentes diversas</li>
            <li>Información sobre el origen etimológico de las palabras</li>
            <li>Categorización gramatical detallada</li>
            <li>Indicación de estilos de uso (formal, coloquial, vulgar, etc.)</li>
            <li>Variantes gráficas y expresiones relacionadas</li>
          </ul>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Enlaces de interés</h2>
          <p className="mb-4 text-gray-700">
            Próximamente agregaremos enlaces a recursos adicionales sobre lexicografía chilena y
            estudios del español de Chile.
          </p>
        </div>
      </div>
    </div>
  );
}
