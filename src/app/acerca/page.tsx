export default function AcercaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-duech-blue mb-12 text-4xl font-bold">Acerca del Proyecto</h1>

      <div className="space-y-6">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Digitalización del DUECh</h2>
          <p className="mb-4 text-gray-700">
            Este proyecto representa un esfuerzo por digitalizar y hacer accesible el Diccionario de
            uso del español de Chile (DUECh), una obra fundamental para la comprensión y estudio del
            español chileno.
          </p>
          <p className="text-gray-700">
            La plataforma web permite realizar búsquedas rápidas y avanzadas, explorar definiciones
            completas, y descubrir la riqueza del léxico chileno de manera interactiva y accesible.
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Objetivos</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Preservar y difundir el patrimonio lingüístico de Chile</li>
            <li>Facilitar el acceso a información lexicográfica especializada</li>
            <li>Apoyar la investigación y enseñanza del español chileno</li>
            <li>Documentar la evolución del lenguaje y sus usos</li>
            <li>Promover el conocimiento y valoración de la diversidad lingüística</li>
          </ul>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Tecnología</h2>
          <p className="mb-4 text-gray-700">
            Esta aplicación web ha sido desarrollada utilizando tecnologías modernas para garantizar
            una experiencia de usuario óptima:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Next.js 14 con App Router para un rendimiento óptimo</li>
            <li>TypeScript para mayor robustez del código</li>
            <li>TailwindCSS para un diseño responsivo y moderno</li>
            <li>Arquitectura modular preparada para integración con Neo4j</li>
          </ul>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Desarrollo Futuro</h2>
          <p className="mb-4 text-gray-700">
            Este MVP es el primer paso hacia una plataforma más completa que incluirá:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Integración con base de datos Neo4j para relaciones semánticas</li>
            <li>Sistema de contribuciones y sugerencias de usuarios</li>
            <li>API pública para investigadores y desarrolladores</li>
            <li>Visualizaciones interactivas de relaciones entre palabras</li>
            <li>Herramientas de análisis lingüístico avanzado</li>
          </ul>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Créditos</h2>
          <p className="text-gray-700">
            Este proyecto es un MVP (Producto Mínimo Viable) desarrollado como parte de un esfuerzo
            de digitalización del patrimonio lingüístico chileno.
          </p>
          <p className="mt-4 text-gray-700">
            El contenido lexicográfico proviene del Diccionario de uso del español de Chile (DUECh).
          </p>
        </div>
      </div>
    </div>
  );
}
