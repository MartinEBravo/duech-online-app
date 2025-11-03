export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--footer-background)' }} className="py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-duech-gold mb-2 text-lg font-semibold">
            Diccionario de uso del Español de Chile
          </p>
          <p className="text-sm text-gray-300">
            Proyecto de digitalización del patrimonio lingüístico chileno
          </p>
          <div className="mt-4 text-xs text-gray-400">Versión 1.0.0</div>
        </div>
      </div>
    </footer>
  );
}
