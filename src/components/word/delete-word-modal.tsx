'use client';

import { useRouter, usePathname } from 'next/navigation';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';

interface DeleteWordModalProps {
  lemma: string;
  onClose: () => void;
}

export function DeleteWordModal({ lemma, onClose }: DeleteWordModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const editorBasePath = pathname?.startsWith('/editor') ? '/editor' : '';

  const handleDelete = async () => {
    const response = await fetch(`/api/words/${encodeURIComponent(lemma)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Error al eliminar la palabra');
    }

    // Redirect to search page after successful deletion
    const searchPath = editorBasePath ? `${editorBasePath}/buscar` : '/buscar';
    router.push(searchPath);
  };

  return (
    <DeleteConfirmationModal
      title="Eliminar Palabra"
      itemName={lemma}
      itemType="la palabra"
      warningMessage="Esta acción no se puede deshacer. Se eliminarán todas las definiciones, ejemplos y comentarios asociados."
      onDelete={handleDelete}
      onClose={onClose}
    />
  );
}
