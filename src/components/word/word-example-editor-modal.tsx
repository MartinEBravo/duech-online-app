'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/common/button';
import { SelectDropdown } from '@/components/common/dropdown';
import { fetchUniqueSources } from '@/lib/actions';

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
  // Mandatory
  author: string;
  year: string;
  publication: string;
  format: string;
  // Optional
  title: string;
  date: string;
  city: string;
  editorial: string;
  volume: string;
  number: string;
  page: string;
  doi: string;
  url: string;
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
  const [sources, setSources] = useState<
    {
      publication: string | null;
      author: string | null;
      year: string | null;
      city: string | null;
      editorial: string | null;
      format: string | null;
    }[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetchUniqueSources().then((res) => {
        if (res.success && res.data) {
          setSources(res.data);
        }
      });
    }
  }, [isOpen]);

  const handleSourceSelect = (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const source = sources[index];
    if (source) {
      onDraftChange({
        ...draft,
        publication: source.publication || '',
        author: source.author || '',
        year: source.year || '',
        city: source.city || '',
        editorial: source.editorial || '',
        format: source.format || '',
      });
    }
  };

  const sourceOptions = sources.map((s, i) => ({
    value: i.toString(),
    label: `${s.publication || 'Sin título'} (${s.year || 's/f'}) - ${s.author || 'Anon'}`,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">{isNew ? 'Nuevo ejemplo' : 'Editar ejemplo'}</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Ejemplo *</label>
            <textarea
              value={draft.value}
              onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
              className="min-h-[100px] w-full rounded border p-2"
              placeholder="Texto del ejemplo"
            />
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <SelectDropdown
              label="Cargar datos desde Nómina (Opcional)"
              options={sourceOptions}
              selectedValue=""
              onChange={handleSourceSelect}
              placeholder="Seleccionar fuente..."
            />
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <h3 className="mb-3 font-semibold text-green-800">Datos bibliográficos obligatorios</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Autor(a,es,as)"
                value={draft.author}
                onChange={(value) => onDraftChange({ ...draft, author: value })}
              />
              <FormInput
                label="Año"
                value={draft.year}
                onChange={(value) => onDraftChange({ ...draft, year: value })}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Publicación (revista, periódico, libro, sitio web)"
                  value={draft.publication}
                  onChange={(value) => onDraftChange({ ...draft, publication: value })}
                  placeholder="Siempre en cursiva"
                />
              </div>
              <FormInput
                label="Formato"
                value={draft.format}
                onChange={(value) => onDraftChange({ ...draft, format: value })}
              />
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <h3 className="mb-3 font-semibold text-yellow-800">Datos bibliográficos opcionales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormInput
                  label="Título (capítulo, artículo)"
                  value={draft.title}
                  onChange={(value) => onDraftChange({ ...draft, title: value })}
                  placeholder="Siempre entre comillas dobles"
                />
              </div>
              <FormInput
                label="Fecha (dd/mm/aa)"
                value={draft.date}
                onChange={(value) => onDraftChange({ ...draft, date: value })}
              />
              <FormInput
                label="Ciudad"
                value={draft.city}
                onChange={(value) => onDraftChange({ ...draft, city: value })}
              />
              <FormInput
                label="Editorial"
                value={draft.editorial}
                onChange={(value) => onDraftChange({ ...draft, editorial: value })}
              />
              <FormInput
                label="Volumen"
                value={draft.volume}
                onChange={(value) => onDraftChange({ ...draft, volume: value })}
              />
              <FormInput
                label="Número"
                value={draft.number}
                onChange={(value) => onDraftChange({ ...draft, number: value })}
              />
              <FormInput
                label="Páginas"
                value={draft.page}
                onChange={(value) => onDraftChange({ ...draft, page: value })}
              />
              <FormInput
                label="DOI"
                value={draft.doi}
                onChange={(value) => onDraftChange({ ...draft, doi: value })}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="URL"
                  value={draft.url}
                  onChange={(value) => onDraftChange({ ...draft, url: value })}
                />
              </div>
            </div>
          </div>
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
