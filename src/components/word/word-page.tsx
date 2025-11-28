/**
 * Word display and editing page component.
 *
 * Renders a complete word entry with definitions, examples, and editor controls.
 * Supports both public viewing and editor editing modes with auto-save.
 *
 * @module components/word/word-page
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MultiSelector } from '@/components/word/multi-selector-modal';
import { Button } from '@/components/common/button';
import { DefinitionSection } from '@/components/word/word-definition';
import { WordHeader } from '@/components/word/word-header';
import { ExampleDisplay } from '@/components/word/word-example';
import { SpinnerIcon, CheckCircleIcon, ExclamationCircleIcon } from '@/components/icons';
import {
  GRAMMATICAL_CATEGORIES,
  STATUS_OPTIONS,
  MEANING_MARKER_GROUPS,
  createEmptyMeaningMarkerValues,
  DICTIONARY_COLORS,
  type Example,
  type Word,
  type Meaning,
  type MeaningMarkerKey,
} from '@/lib/definitions';
import { ExampleEditorModal, type ExampleDraft } from '@/components/word/word-example-editor-modal';
import WordCommentSection from '@/components/word/comment/section';
import type { WordComment } from '@/components/word/comment/globe';
import { DeleteWordModal } from '@/components/word/delete-word-modal';

/**
 * Props for the WordDisplay component.
 */
export interface WordDisplayProps {
  initialWord: Word;
  initialLetter: string;
  initialStatus?: string;
  initialAssignedTo?: number;
  wordId: number;
  initialComments: WordComment[];
  editorMode: boolean;
  initialUsers: Array<{ id: number; username: string; role: string }>;
  userRole?: string;
  craetedBy?: number;
  currentUserId: number | null;
  currentUserRole: string | null;
}

/** @internal */
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** @internal */
type ActiveExample = { defIndex: number; exIndex: number; isNew?: boolean };

/** @internal */
const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

/**
 * Main word display component with editing capabilities.
 *
 * Displays word definitions, examples, and metadata. In editor mode,
 * provides inline editing with debounced auto-save, modal selectors
 * for categories/markers, and comment management.
 *
 * @example
 * ```tsx
 * <WordDisplay
 *   initialWord={word}
 *   initialLetter="c"
 *   initialStatus="draft"
 *   wordId={123}
 *   initialComments={comments}
 *   editorMode={true}
 *   currentUserId={user.id}
 *   currentUserRole={user.role}
 * />
 * ```
 */
export function WordDisplay({
  initialWord,
  initialLetter,
  initialStatus,
  initialAssignedTo,
  wordId,
  initialComments,
  craetedBy,
  editorMode,
  initialUsers,
  userRole,
  currentUserId,
  currentUserRole,
}: WordDisplayProps) {
  const pathname = usePathname();
  const editorBasePath = pathname?.startsWith('/editor') ? '/editor' : '';
  const [word, setWord] = useState<Word>(initialWord);
  const [letter, setLetter] = useState(initialLetter);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedLemma, setLastSavedLemma] = useState(initialWord.lemma);
  const [status, setStatus] = useState<string>(initialStatus || 'draft');
  const [assignedTo, setAssignedTo] = useState<number | null>(initialAssignedTo || null);
  const [users, setUsers] =
    useState<Array<{ id: number; username: string; role: string }>>(initialUsers);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isFirstRender = useRef(true);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const isEditing = (k: string) => editingKey === k;
  const toggle = (k: string) => setEditingKey((prev) => (prev === k ? null : k));

  const [editingCategories, setEditingCategories] = useState<number | null>(null);
  const [editingMarker, setEditingMarker] = useState<{
    defIndex: number;
    markerKey: MeaningMarkerKey;
  } | null>(null);
  const [activeExample, setActiveExample] = useState<ActiveExample | null>(null);
  const [exampleDraft, setExampleDraft] = useState<ExampleDraft | null>(null);

  const isAdmin = currentUserRole === 'admin';
  const isSAdmin = currentUserRole === 'superadmin';

  // Editor can edit if:
  // - Superadmin → always allowed
  // - Admin → always allowed
  // - Creator → allowed
  // - Assigned → allowed
  const canEdit =
    isSAdmin ||
    isAdmin ||
    craetedBy == currentUserId ||
    (!!currentUserId && !!assignedTo && currentUserId === assignedTo);

  // Can assign users if:
  // - Superadmin → always
  // - Admin → allowed
  // - Creator → allowed (optional rule)
  const canAsigned = isSAdmin || isAdmin || craetedBy == currentUserId;

  // Can change status if:
  // - Superadmin → always allowed
  // - Admin → allowed except on preredacted
  const canChangeStatus = (isAdmin && status !== 'preredacted') || isSAdmin;

  // Final check for editing inside editorMode rules
  const canActuallyEdit =
    editorMode &&
    canEdit &&
    (status === 'preredacted' || status === 'included' || status === 'imported');

  // Whether the UI should enable edit mode at all
  const allowEditor = editorMode;

  // Fetch users for assignedTo dropdown (editor mode only)
  useEffect(() => {
    if (!editorMode) return;

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data);
        }
      })
      .catch(() => {});
  }, [editorMode]);

  // Debounced auto-save (editor mode only)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordRef = useRef(word);
  const letterRef = useRef(letter);
  const statusRef = useRef(status);
  const assignedToRef = useRef(assignedTo);

  useEffect(() => {
    statusRef.current = status;
    assignedToRef.current = assignedTo;
    letterRef.current = letter;
  }, [status, assignedTo, letter]);

  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  const autoSave = useCallback(async () => {
    if (!editorMode) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/words/${encodeURIComponent(lastSavedLemma)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordRef.current,
          letter: letterRef.current,
          status: statusRef.current,
          assignedTo: assignedToRef.current,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar');

      setSaveStatus('saved');
      setIsDirty(false);
      setLastSavedLemma(wordRef.current.lemma);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch {
      setSaveStatus('error');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [editorMode, lastSavedLemma]);

  useEffect(() => {
    if (!editorMode) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsDirty(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, letter, status, assignedTo, editorMode]); // Removed autoSave from deps to avoid loop

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    autoSave();
  };

  const handlePreview = () => {
    const url = `${window.location.origin}/palabra/${encodeURIComponent(word.lemma)}?preview=true`;
    window.open(url, '_blank');
  };

  // Helper functions
  const patchWordLocal = (patch: Partial<Word>) => {
    setWord((prev) => ({ ...prev, ...patch }));
  };

  const patchDefLocal = (idx: number, patch: Partial<Meaning>) => {
    setWord((prev) => ({
      ...prev,
      values: prev.values.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  const emptyExample = (): Example => ({
    value: '',
    author: undefined,
    year: undefined,
    publication: undefined,
    format: undefined,
    title: undefined,
    date: undefined,
    city: undefined,
    editorial: undefined,
    volume: undefined,
    number: undefined,
    page: undefined,
    doi: undefined,
    url: undefined,
  });

  const getExamples = (def: Meaning): Example[] => {
    if (Array.isArray(def.examples)) {
      return def.examples;
    }
    const legacy = (def as { example?: Example | Example[] | null }).example;
    if (!legacy) return [];
    return Array.isArray(legacy) ? legacy : [legacy];
  };

  const setExamples = (defIndex: number, arr: Example[]) => {
    setWord((prev) => {
      const values = [...prev.values];
      const normalized = arr.length === 0 ? [emptyExample()] : arr;
      values[defIndex] = {
        ...values[defIndex],
        examples: normalized,
      };
      return { ...prev, values };
    });
  };

  const toExampleDraft = (example: Example): ExampleDraft => ({
    value: example.value ?? '',
    author: example.author ?? '',
    year: example.year ?? '',
    publication: example.publication ?? example.source ?? '', // Fallback to legacy source
    format: example.format ?? '',
    title: example.title ?? '',
    date: example.date ?? '',
    city: example.city ?? '',
    editorial: example.editorial ?? '',
    volume: example.volume ?? '',
    number: example.number ?? '',
    page: example.page ?? '',
    doi: example.doi ?? '',
    url: example.url ?? '',
  });

  const fromExampleDraft = (draft: ExampleDraft): Example => {
    const sanitize = (value: string) => value.trim();
    const base: Example = {
      value: sanitize(draft.value),
    };

    const fields: (keyof ExampleDraft)[] = [
      'author',
      'year',
      'publication',
      'format',
      'title',
      'date',
      'city',
      'editorial',
      'volume',
      'number',
      'page',
      'doi',
      'url',
    ];

    fields.forEach((field) => {
      const val = sanitize(draft[field]);
      if (val) {
        base[field as keyof Example] = val;
      }
    });

    return base;
  };

  const openExampleEditor = (defIndex: number, exIndex: number, isNew = false) => {
    const arr = getExamples(word.values[defIndex]);
    const current = arr[exIndex] ?? emptyExample();
    setActiveExample({ defIndex, exIndex, isNew });
    setExampleDraft(toExampleDraft(current));
  };

  const closeExampleEditor = (shouldDiscardNew = false) => {
    if (shouldDiscardNew && activeExample?.isNew) {
      const arr = getExamples(word.values[activeExample.defIndex]);
      setExamples(
        activeExample.defIndex,
        arr.filter((_, index) => index !== activeExample.exIndex)
      );
    }
    setActiveExample(null);
    setExampleDraft(null);
  };

  const saveExampleDraft = () => {
    if (!activeExample || !exampleDraft) {
      closeExampleEditor();
      return;
    }

    const arr = getExamples(word.values[activeExample.defIndex]);
    const updated = [...arr];
    updated[activeExample.exIndex] = fromExampleDraft(exampleDraft);
    setExamples(activeExample.defIndex, updated);
    closeExampleEditor();
  };

  const handleAddExample = (defIndex: number) => {
    const arr = getExamples(word.values[defIndex]);
    const newExample = emptyExample();
    setExamples(defIndex, [...arr, newExample]);
    openExampleEditor(defIndex, arr.length, true);
  };

  const handleDeleteExample = (defIndex: number, exIndex: number) => {
    const arr = getExamples(word.values[defIndex]);
    if (arr.length <= 1) {
      alert('La definición debe tener al menos un ejemplo.');
      return;
    }
    setExamples(
      defIndex,
      arr.filter((_, i) => i !== exIndex)
    );

    if (activeExample && activeExample.defIndex === defIndex) {
      if (activeExample.exIndex === exIndex) {
        closeExampleEditor();
      } else if (activeExample.exIndex > exIndex) {
        setActiveExample({ ...activeExample, exIndex: activeExample.exIndex - 1 });
      }
    }
  };

  const handleDictionaryChange = (value: string | null) => {
    setWord((prev) => ({
      ...prev,
      values: prev.values.map((def) => ({ ...def, dictionary: value })),
    }));
  };

  const handleAddDefinition = (insertIndex?: number) => {
    const baseNumber = insertIndex !== undefined ? insertIndex + 1 : word.values.length + 1;
    const markerDefaults = createEmptyMeaningMarkerValues();
    const currentDictionary = word.values[0]?.dictionary || null;
    const newDef: Meaning = {
      number: baseNumber,
      origin: null,
      grammarCategory: null,
      remission: null,
      meaning: 'Nueva definición',
      observation: null,
      examples: [emptyExample()],
      variant: null,
      dictionary: currentDictionary,
      ...markerDefaults,
    };

    setWord((prev) => {
      const values = [...prev.values];
      const insertAt = insertIndex !== undefined ? insertIndex + 1 : values.length;
      values.splice(insertAt, 0, newDef);

      const renumbered = values.map((def, idx) => ({
        ...def,
        number: idx + 1,
      }));

      return { ...prev, values: renumbered };
    });
  };

  const handleDeleteDefinition = (defIndex: number) => {
    setWord((prev) => {
      const values = prev.values.filter((_, i) => i !== defIndex);

      const renumbered = values.map((def, idx) => ({
        ...def,
        number: idx + 1,
      }));

      return { ...prev, values: renumbered };
    });
  };

  const handleDeleteWord = () => {
    if (!editorMode || (userRole !== 'admin' && userRole !== 'superadmin')) return;
    setShowDeleteModal(true);
  };

  // Render example helper
  const renderExample = (examples: Example[] | null, defIndex?: number, isEditable = false) => {
    if (!examples || examples.length === 0) {
      // Show "Add example" button in editor mode when no examples exist
      if (isEditable && defIndex !== undefined) {
        return (
          <Button
            onClick={() => handleAddExample(defIndex)}
            className="hover:text-duech-blue text-sm text-gray-500 underline"
          >
            + Añadir ejemplo
          </Button>
        );
      }
      return null;
    }
    const payload = examples.length === 1 ? examples[0] : examples;
    return (
      <ExampleDisplay
        example={payload}
        defIndex={defIndex}
        editorMode={isEditable}
        onEdit={(exIndex) => defIndex !== undefined && openExampleEditor(defIndex, exIndex)}
        onAdd={() => defIndex !== undefined && handleAddExample(defIndex)}
        onDelete={(exIndex) => defIndex !== undefined && handleDeleteExample(defIndex, exIndex)}
      />
    );
  };

  // Save status indicator
  const SaveStatusIndicator = () => {
    if (!editorMode || saveStatus === 'idle') return null;

    const statusConfig = {
      saving: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: <SpinnerIcon className="h-4 w-4" />,
        label: 'Guardando...',
      },
      saved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: <CheckCircleIcon className="h-4 w-4" />,
        label: 'Guardado',
      },
      error: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: <ExclamationCircleIcon className="h-4 w-4" />,
        label: 'Error al guardar',
      },
    } as const;

    const config = statusConfig[saveStatus];

    return (
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg ${config.bg} px-4 py-2 shadow-lg ${config.text}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const hasDefinitions = word.values.length > 0;
  const searchPath = editorBasePath ? `${editorBasePath}/buscar` : '/buscar';
  const searchLabel = editorMode ? 'Buscar' : 'Buscar';

  const dictionary = word.values[0]?.dictionary;
  const cardBgColor = dictionary ? DICTIONARY_COLORS[dictionary] || 'bg-amber-50' : 'bg-white';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SaveStatusIndicator />

      <WordHeader
        lemma={word.lemma}
        onLemmaChange={(v) => patchWordLocal({ lemma: v ?? '' })}
        editorMode={editorMode}
        editingLemma={isEditing('lemma')}
        onStartEditLemma={() => toggle('lemma')}
        onCancelEditLemma={() => setEditingKey(null)}
        root={word.root}
        onRootChange={(v) => patchWordLocal({ root: v ?? '' })}
        editingRoot={isEditing('root')}
        onStartEditRoot={() => toggle('root')}
        onCancelEditRoot={() => setEditingKey(null)}
        letter={letter}
        onLetterChange={setLetter}
        letterOptions={LETTER_OPTIONS}
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        users={users}
        status={status}
        onStatusChange={setStatus}
        statusOptions={STATUS_OPTIONS}
        searchPath={searchPath}
        searchLabel={searchLabel}
        definitions={word.values}
        onDeleteWord={handleDeleteWord}
        userRole={userRole}
        canActuallyEdit={canActuallyEdit}
        canAsigned={canAsigned}
        canChangeStatus={canChangeStatus}
        dictionary={word.values[0]?.dictionary || null}
        onDictionaryChange={handleDictionaryChange}
        onManualSave={handleManualSave}
        isSaved={!isDirty}
        isSaving={saveStatus === 'saving'}
        onPreview={handlePreview}
      />

      <div className={`border-duech-gold rounded-xl border-t-4 ${cardBgColor} p-10 shadow-2xl`}>
        {/* Definitions */}
        <div className="space-y-16">
          {hasDefinitions ? (
            word.values.map((def, defIndex) => (
              <DefinitionSection
                key={defIndex}
                definition={def}
                defIndex={defIndex}
                editorMode={canActuallyEdit}
                editingKey={editingKey}
                onToggleEdit={toggle}
                onPatchDefinition={(patch) => patchDefLocal(defIndex, patch)}
                onSetEditingCategories={() => setEditingCategories(defIndex)}
                onSetEditingMarker={(markerKey) => setEditingMarker({ defIndex, markerKey })}
                onAddDefinition={() => handleAddDefinition(defIndex)}
                onDeleteDefinition={() => handleDeleteDefinition(defIndex)}
                renderExample={renderExample}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center text-gray-600">
              <p>Esta palabra aún no tiene definiciones.</p>
              {canActuallyEdit && (
                <Button
                  type="button"
                  onClick={() => handleAddDefinition()}
                  className="bg-duech-blue rounded-full px-6 py-2 text-sm text-white hover:bg-blue-800"
                >
                  Añadir definición
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {allowEditor && (
        <div className="mt-12 lg:mt-16">
          <WordCommentSection
            key={wordId}
            editorMode={editorMode}
            initial={initialComments}
            lemma={lastSavedLemma}
          />
        </div>
      )}

      {/* Multi-select modals (editor mode only) */}
      {editorMode && editingCategories !== null && (
        <MultiSelector
          isOpen
          onClose={() => setEditingCategories(null)}
          onSave={(cats: string[]) => {
            // Only take the first selected category since it's now a single string
            patchDefLocal(editingCategories, { grammarCategory: cats[0] ?? null });
          }}
          selectedItems={
            word.values[editingCategories].grammarCategory
              ? [word.values[editingCategories].grammarCategory]
              : []
          }
          title="Seleccionar categoría gramatical"
          options={GRAMMATICAL_CATEGORIES}
          maxWidth="2xl"
          columns={3}
          maxSelections={1}
        />
      )}

      {editorMode &&
        editingMarker !== null &&
        (() => {
          const markerMeta = MEANING_MARKER_GROUPS[editingMarker.markerKey];
          const currentValue = word.values[editingMarker.defIndex][editingMarker.markerKey] as
            | string
            | null
            | undefined;
          const selectedItems = currentValue ? [currentValue] : [];
          return (
            <MultiSelector
              isOpen
              onClose={() => setEditingMarker(null)}
              onSave={(values: string[]) => {
                // Only take the first selected value since it's now a single string
                patchDefLocal(editingMarker.defIndex, {
                  [editingMarker.markerKey]: values[0] ?? null,
                } as Partial<Meaning>);
              }}
              selectedItems={selectedItems}
              title={`Seleccionar ${markerMeta.label.toLowerCase()}`}
              options={markerMeta.labels}
              maxWidth="lg"
              columns={2}
              maxSelections={1}
            />
          );
        })()}

      {/* Example editor modal */}
      <ExampleEditorModal
        isOpen={editorMode && activeExample !== null && exampleDraft !== null}
        isNew={activeExample?.isNew ?? false}
        draft={
          exampleDraft ?? {
            value: '',
            author: '',
            year: '',
            publication: '',
            format: '',
            title: '',
            date: '',
            city: '',
            editorial: '',
            volume: '',
            number: '',
            page: '',
            doi: '',
            url: '',
          }
        }
        onDraftChange={setExampleDraft}
        onSave={saveExampleDraft}
        onCancel={() => closeExampleEditor(activeExample?.isNew)}
      />

      {/* Delete word modal */}
      {showDeleteModal && (
        <DeleteWordModal lemma={lastSavedLemma} onClose={() => setShowDeleteModal(false)} />
      )}

      {!editorMode && (
        <div className="text-backdrop-blur-sm mt-12 rounded-lg bg-white/5 p-6">
          <p className="text-gray-600">¿Tienes alguna sugerencia o comentario?</p>
          <p className="text-gray-600">
            Envíanos un correo a{' '}
            <a
              href="mailto:duech.online@gmail.com"
              className="text-duech-gold font-medium hover:text-yellow-600 hover:underline"
            >
              duech.online@gmail.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
