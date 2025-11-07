import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getUsers } from '@/lib/queries';
import UserManagementClient from '@/components/users/user-management-client';

export default async function UsersPage() {
  // Check authentication and authorization
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?redirectTo=/usuarios');
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    redirect('/buscar');
  }

  // Fetch users
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra los usuarios del sistema DUECh Online
          </p>
        </div>

        <UserManagementClient initialUsers={users} currentUser={user} />
      </div>
    </div>
  );
}
