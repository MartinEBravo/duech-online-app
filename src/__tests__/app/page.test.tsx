import { vi } from 'vitest';
vi.mock('@/components/word-of-the-day', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'word-of-the-day' }),
}));
vi.mock('@/lib/editor-mode-server', () => ({
  __esModule: true,
  isEditorMode: vi.fn().mockResolvedValue(false),
  getEditorBasePath: vi.fn().mockResolvedValue(''),
}));
vi.mock('@/lib/dictionary', () => ({
  __esModule: true,
  getWordOfTheDay: vi.fn().mockResolvedValue({
    word: {
      lemma: 'ejemplo',
      values: [
        {
          meaning: 'Una definición breve',
          categories: [],
        },
      ],
    },
    letter: 'e',
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
import React from 'react';
import Page from '@/app/page';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('renders main heading with correct text', async () => {
  render(await Page());
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: /Diccionario del uso del[\s\S]*español de Chile/i,
    })
  ).toBeInTheDocument();
});
