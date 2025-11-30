/**
 * User management client component.
 *
 * Main component for user administration with table and modals.
 *
 * @module components/users/user-management-client
 */

'use client';

import { useState } from 'react';
import { SessionUser } from '@/lib/auth';
import UserTable from '@/components/users/user-table';
import UserFormModal from '@/components/users/user-form-modal';
import DeleteUserModal from '@/components/users/delete-user-modal';
import ResetPasswordModal from '@/components/users/reset-password-modal';
import { Button } from '@/components/common/button';

/**
 * User data structure for management.
 */
export interface UserManagementUser {
  /** User ID */
  id: number;
  /** Username */
  username: string;
  /** User email */
  email: string | null;
  /** User role */
  role: string;
  /** Account creation date */
  createdAt: Date;
}

/**
 * Props for the UserManagementClient component.
 */
export interface UserManagementClientProps {
  /** Initial list of users */
  initialUsers: UserManagementUser[];
  /** Current logged-in user */
  currentUser: SessionUser;
}

/**
 * User management page client component.
 *
 * Displays user table with actions and manages create/edit/delete modals.
 *
 * @example
 * ```tsx
 * <UserManagementClient
 *   initialUsers={users}
 *   currentUser={session.user}
 * />
 * ```
 */
export default function UserManagementClient({
  initialUsers,
  currentUser,
}: UserManagementClientProps) {
  const [users, setUsers] = useState<UserManagementUser[]>(initialUsers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserManagementUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<UserManagementUser | null>(
    null
  );

  const handleUserCreated = (newUser: UserManagementUser) => {
    setUsers([...users, newUser]);
    setIsCreateModalOpen(false);
  };

  const handleUserUpdated = (updatedUser: UserManagementUser) => {
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
        <Button onClick={() => setIsCreateModalOpen(true)}>Agregar usuario</Button>
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
