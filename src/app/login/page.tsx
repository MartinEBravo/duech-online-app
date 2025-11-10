import LoginForm from '@/components/auth/login-form';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const headersList = await headers();
  const isEditorMode = headersList.get('x-editor-mode') === 'true';

  // Redirect to editor domain if not in editor mode
  if (!isEditorMode) {
    const editorHost = process.env.HOST_URL || 'editor.localhost:3000';
    redirect(`http://${editorHost}/login`);
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">Iniciar sesión</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
