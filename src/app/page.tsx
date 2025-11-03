import React from 'react';
import { ArrowRightIcon, InformationCircleIcon, CheckCircleIcon } from '@/components/icons';
import { Button } from '@/components/common/button';
import SearchBar from '@/components/search/search-bar';
import WordOfTheDay, { type WordOfTheDayData } from '@/components/word-of-the-day';
import { getEditorBasePath, isEditorMode } from '@/lib/editor-mode-server';
import { getWordOfTheDay } from '@/lib/dictionary';

export default async function Home() {
  const editorMode = await isEditorMode();
  const editorBasePath = editorMode ? await getEditorBasePath() : '';
  let wordOfTheDayData: WordOfTheDayData | null = null;

  try {
    wordOfTheDayData = await getWordOfTheDay();
  } catch {
    wordOfTheDayData = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          <span className="text-duech-blue">Diccionario de uso del</span>
          <br />
          <span className="text-duech-gold">español de Chile (2026)</span>
          <br />
          <span className="text-2xl font-semibold text-gray-700">Edición actualizada</span>
        </h1>
        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-700">
          Explora la riqueza del español chileno a través de este diccionario digital. Descubre
          palabras propias de Chile que revelan su riqueza y diversidad.
        </p>
      </div>

      <div className="mx-auto mb-16 max-w-2xl">
        <SearchBar
          placeholder="Buscar palabra en el diccionario..."
          className="shadow-xl"
          editorMode={editorMode}
        />
      </div>

      <div className="mb-16 grid gap-10 md:grid-cols-2">
        <WordOfTheDay data={wordOfTheDayData} editorMode={editorMode} />

        <div className="border-duech-blue card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
          <h2 className="text-duech-blue mb-6 flex items-center text-2xl font-bold">
            <InformationCircleIcon className="mr-3 h-6 w-6 flex-shrink-0" />
            Acerca del DUECh
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-800">
            El Diccionario de uso del español de Chile (DUECh) en su edición de 2026 es una obra
            lexicográfica que documenta el uso del español en Chile, incluyendo voces y expresiones
            propias de Chile, que revelan la riqueza y diversidad de este país.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
              <span className="font-medium">Definiciones completas y contextualizadas</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
              <span className="font-medium">Ejemplos de uso real y contextual</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
              <span className="font-medium">Categorías gramaticales y estilos de uso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-12 text-center">
        <h2 className="text-duech-blue mb-6 text-3xl font-bold">Explora el diccionario</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-700">
          Personaliza tus búsquedas con filtros por categoría, estilo de uso, origen o letra inicial
          directamente desde la barra de búsqueda.
        </p>

        <Button
          href={`${editorBasePath || ''}/buscar`}
          className="bg-duech-blue px-8 py-4 font-semibold text-white hover:bg-blue-800"
        >
          Abrir buscador <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-50" />
        </Button>
      </div>
    </div>
  );
}
