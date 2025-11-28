import Link from 'next/link';
import { Button } from '@/components/common/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-duech-blue mb-4 text-6xl font-bold">404</h1>
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">Página no encontrada</h2>
      <p className="mb-8 max-w-md text-gray-600">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link href="/">
        <Button className="bg-duech-blue rounded-full px-8 py-3 text-white hover:bg-blue-800">
          Volver al inicio
        </Button>
      </Link>
    </div>
  );
}
