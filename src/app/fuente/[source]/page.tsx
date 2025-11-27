'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { WordCard } from '@/components/search/word-card';
import { fetchWordsBySource } from '@/lib/actions';
import { type SearchResult } from '@/lib/definitions';
import { ArrowLeftIcon, BookOpenIcon } from '@/components/icons';

export default function SourcePage() {
    const params = useParams();
    const source = decodeURIComponent(params.source as string);
    const [words, setWords] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadWords() {
            setIsLoading(true);
            setError(null);
            const result = await fetchWordsBySource(source);
            if (result.success && result.data) {
                setWords(result.data);
            } else {
                setError(result.error || 'Error al cargar las palabras');
            }
            setIsLoading(false);
        }

        if (source) {
            loadWords();
        }
    }, [source]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
                href="/buscar"
                className="text-duech-blue mb-6 inline-flex items-center gap-2 hover:underline"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver al buscador
            </Link>

            {/* Header */}
            <div className="mb-8 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                        <BookOpenIcon className="text-duech-blue h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-duech-blue text-2xl font-bold">Palabras de esta fuente</h1>
                        <p className="mt-1 text-lg text-gray-700">
                            <span className="font-semibold">{source}</span>
                        </p>
                        {!isLoading && !error && (
                            <p className="mt-2 text-sm text-gray-500">
                                {words.length} {words.length === 1 ? 'palabra encontrada' : 'palabras encontradas'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="py-12 text-center">
                    <div className="border-duech-blue mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Cargando palabras...</p>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Results */}
            {!isLoading && !error && words.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                    <p className="text-gray-600">No se encontraron palabras con ejemplos de esta fuente.</p>
                </div>
            )}

            {!isLoading && !error && words.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {words.map((word) => (
                        <WordCard
                            key={word.lemma}
                            lemma={word.lemma}
                            letter={word.letter}
                            editorMode={false}
                            dictionary={word.dictionary}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
