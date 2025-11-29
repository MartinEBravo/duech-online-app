/**
 * Test utilities and mock factories for API testing.
 *
 * @module __tests__/utils/test-helpers
 */

import { vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for testing API routes.
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Headers).set('Content-Type', 'application/json');
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

/**
 * Mock user data factory for testing.
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'lexicographer',
    passwordHash: '$2b$10$hashedpassword',
    currentSessionId: 'session123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockUser {
  id: number;
  username: string;
  email: string;
  role: string;
  passwordHash: string;
  currentSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock session user for auth testing.
 */
export function createMockSessionUser(overrides: Partial<MockSessionUser> = {}): MockSessionUser {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'testuser',
    role: 'lexicographer',
    sessionId: 'session123',
    ...overrides,
  };
}

export interface MockSessionUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  sessionId?: string;
}

/**
 * Mock word data factory for testing.
 */
export function createMockWord(overrides: Partial<MockWord> = {}): MockWord {
  return {
    id: 1,
    lemma: 'ejemplo',
    root: 'ejemplo',
    letter: 'e',
    status: 'published',
    assignedTo: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    values: [
      {
        number: 1,
        meaning: 'Una definición de ejemplo',
        origin: null,
        grammarCategory: 'noun',
        remission: null,
        observation: null,
        examples: null,
        variant: null,
        socialValuations: null,
        socialStratumMarkers: null,
        styleMarkers: null,
        intentionalityMarkers: null,
        geographicalMarkers: null,
        chronologicalMarkers: null,
        frequencyMarkers: null,
      },
    ],
    notes: [],
    ...overrides,
  };
}

export interface MockWord {
  id: number;
  lemma: string;
  root: string;
  letter: string;
  status: string;
  assignedTo: number | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  values: MockMeaning[];
  notes: MockNote[];
}

export interface MockMeaning {
  number: number;
  meaning: string;
  origin: string | null;
  grammarCategory: string | null;
  remission: string | null;
  observation: string | null;
  examples: unknown[] | null;
  variant: string | null;
  socialValuations: string | null;
  socialStratumMarkers: string | null;
  styleMarkers: string | null;
  intentionalityMarkers: string | null;
  geographicalMarkers: string | null;
  chronologicalMarkers: string | null;
  frequencyMarkers: string | null;
}

export interface MockNote {
  id: number;
  note: string;
  createdAt: string;
  user: { id: number; username: string } | null;
}

/**
 * Mock password reset token factory.
 */
export function createMockPasswordResetToken(
  overrides: Partial<MockPasswordResetToken> = {}
): MockPasswordResetToken {
  return {
    id: 1,
    token: 'reset-token-123',
    userId: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    user: createMockUser(),
    ...overrides,
  };
}

export interface MockPasswordResetToken {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  user: MockUser;
}

/**
 * Creates a spy that returns the given value.
 */
export function createResolvedSpy<T>(value: T) {
  return vi.fn().mockResolvedValue(value);
}

/**
 * Creates a spy that rejects with the given error.
 */
export function createRejectedSpy(error: Error) {
  return vi.fn().mockRejectedValue(error);
}

/**
 * Extracts JSON body from a Response object.
 */
export async function getResponseJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Asserts response status and returns parsed JSON.
 */
export async function expectResponse<T = unknown>(
  response: Response,
  expectedStatus: number
): Promise<T> {
  expect(response.status).toBe(expectedStatus);
  return getResponseJson<T>(response);
}
