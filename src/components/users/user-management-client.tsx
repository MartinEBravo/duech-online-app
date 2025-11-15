'use client';

import { useState } from 'react';
import { SessionUser } from '@/lib/auth';
import UserTable from '@/components/users/user-table';
import UserFormModal from '@/components/users/user-form-modal';
import DeleteUserModal from '@/components/users/delete-user-modal';
import ResetPasswordModal from '@/components/users/reset-password-modal';
import { Button } from '@/components/common/button';

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  createdAt: Date;
}

interface UserManagementClientProps {
  initialUsers: User[];
  currentUser: SessionUser;
}

export default function UserManagementClient({
  initialUsers,
  currentUser,
}: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);

  const handleUserCreated = (newUser: User) => {
    setUsers([...users, newUser]);
    setIsCreateModalOpen(false);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setEditingUser(null);
  };

  const handleUserDeleted = (userId: number) => {
    setUsers(users.filter((u) => u.id !== userId));
    setDeletingUser(null);
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setIsCreateModalOpen(true)}>Agregar Usuario</Button>
      </div>

      <UserTable
        users={users}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        onEdit={setEditingUser}
        onDelete={setDeletingUser}
        onResetPassword={setResettingPasswordUser}
      />

      {isCreateModalOpen && (
        <UserFormModal
          mode="create"
          currentUserRole={currentUser.role}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {editingUser && (
        <UserFormModal
          mode="edit"
          user={editingUser}
          currentUserRole={currentUser.role}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onSuccess={() => handleUserDeleted(deletingUser.id)}
        />
      )}

      {resettingPasswordUser && (
        <ResetPasswordModal
          user={resettingPasswordUser}
          onClose={() => setResettingPasswordUser(null)}
        />
      )}
    </div>
  );
}
