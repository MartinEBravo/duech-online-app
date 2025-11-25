'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert } from '@/components/common/alert';
import { Button } from '@/components/common/button';

interface RedactedWord {
  id: number;
  lemma: string;
  notes?: Array<{
    id: number;
    note: string | null;
  }> | null;
}

interface RedactedWordsClientProps {
  initialWords: RedactedWord[];
  userEmail: string;
}

export function RedactedWordsClient({ initialWords, userEmail }: RedactedWordsClientProps) {
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendEmail = async () => {
    setIsSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/words/redacted/send-email', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Error al enviar el correo');
        return;
      }

      setSuccessMessage(`Reporte enviado exitosamente a ${data.email}`);
    } catch (error) {
      setErrorMessage('Error al enviar el correo. Por favor, intenta nuevamente.');
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Palabras Redactadas</h1>
        <p className="text-gray-600">
          Total de palabras en estado redactada: <strong>{initialWords.length}</strong>
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button href="/api/words/report" className="bg-duech-blue text-white hover:bg-blue-700">
          Descargar PDF
        </Button>

        <Button
          onClick={handleSendEmail}
          loading={isSending}
          disabled={isSending}
          className="bg-duech-gold text-gray-900 hover:bg-yellow-500"
        >
          {isSending ? 'Enviando...' : 'Enviar por correo'}
        </Button>

        <div className="flex items-center text-sm text-gray-500">
          <span>Correo destino: {userEmail}</span>
        </div>
      </div>

      {/* Words List */}
      {initialWords.length === 0 ? (
        <Alert variant="info">No se encontraron palabras en estado redactada.</Alert>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Palabra
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Comentarios Editoriales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {initialWords.map((word, index) => (
                  <tr key={word.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/palabra/${encodeURIComponent(word.lemma)}`}
                        className="text-duech-blue font-semibold hover:text-blue-700 hover:underline"
                      >
                        {word.lemma}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {word.notes && word.notes.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {word.notes.map((note) => (
                            <li key={note.id} className="flex items-start">
                              <span className="mr-2 text-gray-400">•</span>
                              <span>{note.note || 'Sin comentario'}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin comentarios</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
