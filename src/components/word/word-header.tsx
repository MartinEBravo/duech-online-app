'use client';

import React from 'react';
import { useMemo } from 'react';
import Link from 'next/link';
import InlineEditable from '@/components/word/inline-editable';
import { SelectDropdown } from '@/components/common/dropdown';
import { Button } from '@/components/common/button';
import { InformationCircleIcon, EyeIcon, SaveIcon, SpinnerIcon } from '@/components/icons';
import WordWarning from '@/components/word/word-warning';
import { DICCIONARIES, type Meaning } from '@/lib/definitions';
import { useUserRole } from '@/hooks/useUserRole';
import { getLexicographerByRole } from '@/lib/search-utils';
import { getStatusByRole } from '@/lib/search-utils';
interface WordHeaderProps {
  lemma: string;
  onLemmaChange: (value: string | null) => void;
  editorMode: boolean;
  canActuallyEdit: boolean;
  canAsigned: boolean;
  canChangeStatus?: boolean;
  // Lemma field
  editingLemma: boolean;
  onStartEditLemma: () => void;
  onCancelEditLemma: () => void;
  // Root field
  root: string;
  onRootChange: (value: string | null) => void;
  editingRoot: boolean;
  onStartEditRoot: () => void;
  onCancelEditRoot: () => void;
  // Dictionary field
  dictionary: string | null;
  onDictionaryChange: (value: string | null) => void;
  // Editor controls
  letter: string;
  onLetterChange: (value: string) => void;
  letterOptions: Array<{ value: string; label: string }>;
  assignedTo: number | null;
  onAssignedToChange: (value: number | null) => void;
  users: Array<{ id: number; username: string; role: string }>;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  searchPath: string;
  searchLabel: string;
  definitions?: Meaning[];
  onDeleteWord?: () => void;
  userRole?: string;
  onManualSave?: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
  onPreview?: () => void;
}

export function WordHeader({
  lemma,
  onLemmaChange,
  editorMode,
  canActuallyEdit,
  canAsigned,
  canChangeStatus,
  editingLemma,
  onStartEditLemma,
  onCancelEditLemma,
  root,
  onRootChange,
  editingRoot,
  onStartEditRoot,
  onCancelEditRoot,
  dictionary,
  onDictionaryChange,
  letter,
  onLetterChange,
  letterOptions,
  assignedTo,
  onAssignedToChange,
  users,
  status,
  onStatusChange,
  statusOptions,
  searchPath,
  searchLabel,
  definitions,
  onDeleteWord,
  userRole,
  onManualSave,
  isSaved,
  isSaving,
  onPreview,
}: WordHeaderProps) {
  const { isAdmin, isLexicographer, username } = useUserRole(true);

  const userOptions = useMemo(
    () => getLexicographerByRole(users, username, isAdmin, isLexicographer),
    [users, username, isAdmin, isLexicographer] // ← all dependencies
  );
  const statusFilters = useMemo(
    () => getStatusByRole(statusOptions, isAdmin, isLexicographer),
    [statusOptions, isAdmin, isLexicographer]
  );

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href={searchPath} className="text-blue-600 hover:text-blue-800">
              {searchLabel}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{lemma}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-duech-blue text-5xl font-bold">
            <InlineEditable
              value={lemma}
              onChange={onLemmaChange}
              editorMode={canActuallyEdit}
              editing={editingLemma}
              onStart={onStartEditLemma}
              onCancel={onCancelEditLemma}
              saveStrategy="manual"
              placeholder="(lema)"
            />
          </h1>
          <div className="flex items-center gap-2">
            {/* Show root: in editor mode always, in public mode only if different from lemma */}
            {(editorMode || (root && root !== lemma)) && (
              <>
                <span className="text-lg text-gray-700">Palabra base:</span>
                <span className="text-duech-blue font-semibold">
                  <InlineEditable
                    value={root}
                    onChange={onRootChange}
                    editorMode={canActuallyEdit}
                    editing={editingRoot}
                    onStart={onStartEditRoot}
                    onCancel={onCancelEditRoot}
                    saveStrategy="manual"
                    placeholder="Palabra base"
                    addLabel="+ Añadir palabra base"
                  />
                </span>
              </>
            )}
          </div>
          {/* Show dictionary source in public mode */}
          {!editorMode && dictionary && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Fuente:</span> {dictionary}
            </div>
          )}
        </div>

        {/* Editor controls */}
        {editorMode && (
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <div className="w-32">
              <SelectDropdown
                label="Diccionario"
                options={DICCIONARIES}
                selectedValue={dictionary || ''}
                onChange={(val) => onDictionaryChange(val || null)}
                placeholder="Seleccionar"
                disabled={!canActuallyEdit}
              />
            </div>
            <div className="w-24">
              <SelectDropdown
                label="Letra"
                options={letterOptions}
                selectedValue={letter}
                onChange={(value) => onLetterChange(value.toLowerCase())}
                placeholder="Letra"
                disabled={!canActuallyEdit}
              />
            </div>

            <div className="w-36">
              <SelectDropdown
                label="Asignado a"
                options={userOptions}
                selectedValue={assignedTo?.toString() ?? ''}
                onChange={(value) => onAssignedToChange(value ? Number(value) : null)}
                placeholder="Sin asignar"
                disabled={!(canAsigned || canActuallyEdit)}
              />
            </div>

            <div className="w-32">
              <SelectDropdown
                label="Estado"
                options={statusFilters}
                selectedValue={status}
                onChange={onStatusChange}
                placeholder="Seleccionar estado"
                disabled={!canActuallyEdit && !canChangeStatus}
              />
            </div>

            {/* Preview Button */}
            {onPreview && (
              <Button
                type="button"
                onClick={onPreview}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                title="Previsualizar"
              >
                Previsualizar
              </Button>
            )}

            {/* Manual Save Button */}
            {onManualSave && (
              <Button
                type="button"
                onClick={onManualSave}
                disabled={isSaving}
                className={`rounded-md px-4 py-2 text-white transition-colors ${isSaved
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                title="Guardar cambios"
              >
                {isSaved ? 'Guardado' : 'Guardar cambios'}
                {isSaving ? <SpinnerIcon className="h-5 w-5" /> : ""}
              </Button>
            )}

            {onDeleteWord && (userRole === 'admin' || userRole === 'superadmin') && (
              <Button
                type="button"
                onClick={onDeleteWord}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Eliminar palabra
              </Button>
            )}
          </div>
        )}
      </div>
      {editorMode && canActuallyEdit && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-20 w-20 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-gray-700">
              <p className="mb-2 font-semibold text-blue-900">
                Para empezar a editar, basta con hacer clic en el ícono de lápiz.
              </p>
              <p className="mb-2 font-semibold text-blue-900">Formato de texto con Markdown:</p>
              <ul className="space-y-1">
                <li>
                  <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">*cursiva*</code> para{' '}
                  <em>cursiva</em>
                </li>
                <li>
                  <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">**negrita**</code>{' '}
                  para <strong>negrita</strong>
                </li>
                <li>
                  <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">***ambos***</code>{' '}
                  para{' '}
                  <strong>
                    <em>negrita y cursiva</em>
                  </strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings summary below the info box */}
      {editorMode && canActuallyEdit && definitions && definitions.length > 0 && (
        <WordWarning definitions={definitions} className="mb-6" />
      )}
    </>
  );
}
