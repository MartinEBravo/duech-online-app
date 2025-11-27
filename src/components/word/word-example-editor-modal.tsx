'use client';

import React from 'react';
import { Button } from '@/components/common/button';

// Helper component for form input fields
function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border p-2"
        placeholder={placeholder}
      />
    </div>
  );
}

type ExampleDraft = {
  value: string;
  author: string;
  title: string;
  source: string;
  date: string;
  page: string;
};

interface ExampleEditorModalProps {
  isOpen: boolean;
  isNew: boolean;
  draft: ExampleDraft;
  onDraftChange: (draft: ExampleDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ExampleEditorModal({
  isOpen,
  isNew,
  draft,
  onDraftChange,
  onSave,
  onCancel,
}: ExampleEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">{isNew ? 'Nuevo ejemplo' : 'Editar ejemplo'}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Ejemplo *</label>
            <textarea
              value={draft.value}
              onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
              className="min-h-[100px] w-full rounded border p-2"
              placeholder="Texto del ejemplo"
            />
          </div>
          <FormInput
            label="Autor"
            value={draft.author}
            onChange={(value) => onDraftChange({ ...draft, author: value })}
          />
          <FormInput
            label="Título"
            value={draft.title}
            onChange={(value) => onDraftChange({ ...draft, title: value })}
          />
          <FormInput
            label="Fuente"
            value={draft.source}
            onChange={(value) => onDraftChange({ ...draft, source: value })}
          />
          <FormInput
            label="Fecha"
            value={draft.date}
            onChange={(value) => onDraftChange({ ...draft, date: value })}
          />
          <FormInput
            label="URL"
            value={draft.page}
            onChange={(value) => onDraftChange({ ...draft, page: value })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} className="rounded border px-4 py-2 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            className="bg-duech-blue rounded px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ExampleDraft };
