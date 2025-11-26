/**
 * Type definitions and constants for the Chilean Spanish Dictionary (DUECh).
 *
 * This module contains all TypeScript interfaces, types, and constant definitions
 * used throughout the application for type safety and data consistency.
 *
 * Key exports:
 * - Data structures: Example, WordNote, DBWord, Meaning, Word, SearchResult
 * - Filter types: SearchFilters, MarkerFilterState
 * - Constants: GRAMMATICAL_CATEGORIES, ORIGINS, MEANING_MARKER_GROUPS
 * - Utility functions: createEmptyMeaningMarkerValues, createEmptyMarkerFilterState
 *
 * @module lib/definitions
 */

/**
 * Example citation for a word meaning.
 * Contains the example text and optional bibliographic metadata.
 */
export interface Example {
  value: string;
  author?: string;
  title?: string;
  source?: string;
  date?: string;
  page?: string;
}

/**
 * Editorial note/comment attached to a word.
 * Used for internal communication between editors.
 */
export interface WordNote {
  /** Unique identifier for the note */
  id: number;
  /** The comment text content */
  note: string;
  /** ISO date string of when the note was created */
  createdAt: string;
  /** The user who created the note */
  user?: { id?: number; username?: string } | null;
}

/**
 * Database word representation as returned by Drizzle ORM.
 * This is the raw database format before transformation to frontend format.
 */
export interface DBWord {
  /** Unique database identifier */
  id: number;
  /** The dictionary headword (lemma) */
  lemma: string;
  /** Root/base word if different from lemma */
  root: string | null;
  /** First letter for alphabetical indexing (a-z, ñ) */
  letter: string;
  /** Variant form indicator */
  variant?: string | null;
  /** Editorial workflow status */
  status: string;
  /** User ID who created this word */
  createdBy?: number | null;
  /** User ID assigned to work on this word */
  assignedTo?: number | null;
  /** Timestamp of creation */
  createdAt: Date;
  /** Timestamp of last update */
  updatedAt: Date;
  /** Associated meanings (when joined) */
  meanings?: Meaning[];
}

/**
 * Union type of all linguistic marker field keys.
 * These markers classify meanings according to various sociolinguistic dimensions.
 */
export type MeaningMarkerKey =
  | 'socialValuations'
  | 'socialStratumMarkers'
  | 'styleMarkers'
  | 'intentionalityMarkers'
  | 'geographicalMarkers'
  | 'chronologicalMarkers'
  | 'frequencyMarkers';

/**
 * Partial record of marker key-value pairs for a meaning.
 */
export type MeaningMarkerValues = Partial<Record<MeaningMarkerKey, string | null>>;

/**
 * Word meaning/definition (acepción).
 * Represents a single numbered definition of a word with all its metadata.
 */
export interface Meaning extends MeaningMarkerValues {
  /** Database ID */
  id?: number;
  /** Parent word ID */
  wordId?: number;
  /** Definition number (1, 2, 3, etc.) */
  number: number;
  /** Etymological origin (e.g., "mapuche", "quechua") */
  origin?: string | null;
  /** The definition text */
  meaning: string;
  /** Editorial observation or note */
  observation?: string | null;
  /** Cross-reference to another word */
  remission?: string | null;
  /** Grammatical category (e.g., "m", "f", "adj") */
  grammarCategory?: string | null;
  /** Source dictionary (e.g., "duech", "difruech") */
  dictionary?: string | null;
  /** Usage examples with citations */
  examples?: Example[] | null;
  /** Variant indicator */
  variant?: string | null;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Frontend word representation.
 * Simplified format used for display and editing in the UI.
 */
export interface Word {
  /** The dictionary headword */
  lemma: string;
  /** Root/base word */
  root: string;
  /** Array of meanings/definitions */
  values: Meaning[];
}

/**
 * Search result item returned from dictionary searches.
 * Contains the word data and metadata about the match.
 */
export interface SearchResult {
  /** The word data */
  word: Word;
  /** First letter for alphabetical grouping */
  letter: string;
  /** How the word matched the search query */
  matchType: 'exact' | 'partial' | 'filter';
  /** Editorial status (for editor mode) */
  status?: string;
  /** Assigned editor user ID */
  assignedTo: number | null;
  /** Creator user ID */
  createdBy?: number | null;
}

/**
 * State for marker filter selections in the UI.
 * Uses arrays for multi-select, though DB stores single strings per meaning.
 */
export type MarkerFilterState = Partial<Record<MeaningMarkerKey, string[]>>;

/**
 * Search filter parameters for dictionary queries.
 * All filters are optional and can be combined.
 */
export type SearchFilters = {
  /** Text query to search in lemmas and content */
  query?: string;
  /** Grammatical categories to filter by */
  categories?: string[];
  /** Etymology/origin languages to filter by */
  origins?: string[];
  /** First letters to filter by */
  letters?: string[];
  /** Source dictionaries to filter by */
  dictionaries?: string[];
} & MarkerFilterState;

/**
 * Available marker values for each marker type.
 */
export type MarkerMetadata = Record<MeaningMarkerKey, string[]>;

/**
 * Metadata about available filter options.
 * Used to populate filter dropdowns in the search UI.
 */
export interface SearchMetadata {
  /** Available grammatical categories */
  categories: string[];
  /** Available origins/etymologies */
  origins: string[];
  /** Available source dictionaries */
  dictionaries: string[];
  /** Available values for each marker type */
  markers: MarkerMetadata;
}

/**
 * Complete search response including results, metadata, and pagination.
 */
export interface SearchResponse {
  /** Array of matching words */
  results: SearchResult[];
  /** Available filter options based on current results */
  metadata: SearchMetadata;
  /** Pagination information */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Results per page */
    limit: number;
    /** Total number of matching results */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more results */
    hasNext: boolean;
    /** Whether there are previous results */
    hasPrev: boolean;
  };
}

/**
 * Mapping of grammatical category codes to Spanish display names.
 * Keys are the database codes, values are human-readable labels.
 */
export const GRAMMATICAL_CATEGORIES: Record<string, string> = {
  adj: 'Adjetivo',
  'adj/adv': 'Adjetivo/Adverbio',
  'adj/sust': 'Adjetivo/Sustantivo',
  adv: 'Adverbio',
  fórm: 'Fórmula',
  interj: 'Interjección',
  'loc. sust/adj': 'Locución sustantiva/adjetiva',
  'loc. adj': 'Locución adjetiva',
  'loc. adj/adv': 'Locución adjetiva/adverbial',
  'loc. adj/sust': 'Locución adjetiva/sustantiva',
  'loc. adv/adj': 'Locución adverbial/adjetiva',
  'loc. adv': 'Locución adverbial',
  'loc. interj': 'Locución interjectiva',
  'loc. sust': 'Locución sustantiva',
  'loc. verb': 'Locución verbal',
  impers: 'Impersonal',
  'marc. disc': 'Marcador discursivo',
  sust: 'Sustantivo/Adjetivo',
  f: 'Sustantivo femenino',
  m: 'Sustantivo masculino',
  'm o f': 'Sustantivo masculino o femenino',
  'm-f': 'Sustantivo masculino-femenino',
  'm y f': 'Sustantivo masculino y femenino',
  'm. pl': 'Sustantivo masculino plural',
  'f. pl': 'Sustantivo femenino plural',
  intr: 'Verbo intransitivo',
  tr: 'Verbo transitivo',
};

/**
 * Social valuation markers (valoración social).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const SOCIAL_VALUATIONS: Record<string, string> = {
  vulgar: 'Vulgar',
  euf: 'Eufemismo',
};

/**
 * Geographical region markers (marca geográfica).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const GEOGRAPHICAL_MARKERS: Record<string, string> = {
  norte: 'Norte',
  centro: 'Centro',
  sur: 'Sur',
  austral: 'Zona Austral',
};

/**
 * Social stratum markers (marca de estrato social).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const SOCIAL_STRATUM_MARKERS: Record<string, string> = {
  pop: 'Popular',
  cult: 'Culto',
};

/**
 * Style markers (marca de estilo).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const STYLE_MARKERS: Record<string, string> = {
  espon: 'Espontáneo',
  esm: 'Esmerado',
};

/**
 * Intentionality markers (marca de intencionalidad).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const INTENTIONALITY_MARKERS: Record<string, string> = {
  fest: 'Festivo',
  desp: 'Despectivo',
  afect: 'Afectivo',
};

/**
 * Chronological markers (marca cronológica).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const CRONOLOGICAL_MARKERS: Record<string, string> = {
  hist: 'Histórico',
  obsol: 'Obsolescente',
};

/**
 * Frequency markers (marca de frecuencia).
 * @internal Used by MEANING_MARKER_GROUPS
 */
const FREQUENCY_MARKERS: Record<string, string> = {
  'p. us': 'Poco usado',
};

/**
 * Configuration for all meaning marker groups.
 * Each group contains display labels and available values for a marker type.
 * Used for rendering filter dropdowns and inline editing.
 */
export const MEANING_MARKER_GROUPS: Record<
  MeaningMarkerKey,
  {
    /** Display label for the marker category */
    label: string;
    /** Button text for adding a new marker */
    addLabel: string;
    /** Code-to-label mapping for marker values */
    labels: Record<string, string>;
  }
> = {
  socialValuations: {
    label: 'Valoración social',
    addLabel: '+ Añadir valoración social',
    labels: SOCIAL_VALUATIONS,
  },
  socialStratumMarkers: {
    label: 'Marca de estrato social',
    addLabel: '+ Añadir marca de estrato social',
    labels: SOCIAL_STRATUM_MARKERS,
  },
  styleMarkers: {
    label: 'Marca de estilo',
    addLabel: '+ Añadir marca de estilo',
    labels: STYLE_MARKERS,
  },
  intentionalityMarkers: {
    label: 'Marca de intencionalidad',
    addLabel: '+ Añadir marca de intencionalidad',
    labels: INTENTIONALITY_MARKERS,
  },
  geographicalMarkers: {
    label: 'Marca geográfica',
    addLabel: '+ Añadir marca geográfica',
    labels: GEOGRAPHICAL_MARKERS,
  },
  chronologicalMarkers: {
    label: 'Marca cronológica',
    addLabel: '+ Añadir marca cronológica',
    labels: CRONOLOGICAL_MARKERS,
  },
  frequencyMarkers: {
    label: 'Marca de frecuencia',
    addLabel: '+ Añadir marca de frecuencia',
    labels: FREQUENCY_MARKERS,
  },
};

/**
 * Array of all meaning marker keys for iteration.
 */
export const MEANING_MARKER_KEYS = Object.keys(MEANING_MARKER_GROUPS) as MeaningMarkerKey[];

/**
 * Creates an empty record with all marker keys set to null.
 * Used when initializing a new meaning.
 *
 * @returns Record with all marker keys mapped to null
 */
export function createEmptyMeaningMarkerValues(): Record<MeaningMarkerKey, string | null> {
  return MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      acc[key] = null;
      return acc;
    },
    {} as Record<MeaningMarkerKey, string | null>
  );
}

/**
 * Creates an empty filter state with all marker keys set to empty arrays.
 * Used when initializing search filter state.
 *
 * @returns Record with all marker keys mapped to empty arrays
 */
export function createEmptyMarkerFilterState(): Record<MeaningMarkerKey, string[]> {
  return MEANING_MARKER_KEYS.reduce(
    (acc, key) => {
      acc[key] = [];
      return acc;
    },
    {} as Record<MeaningMarkerKey, string[]>
  );
}

/**
 * Mapping of etymology/origin codes to Spanish display names.
 * Represents languages and cultures that have contributed words to Chilean Spanish.
 */
export const ORIGINS: Record<string, string> = {
  africano: 'Africano',
  aimara: 'Aymara',
  'aimara y quechua': 'Aymara y quechua',
  alemán: 'Alemán',
  'alemán, con influencia del inglés': 'Alemán, con influencia del inglés',
  arahuaco: 'Arawaco',
  croata: 'Croata',
  francés: 'Francés',
  'indígena antillano o mexicano': 'Indígena antillano o mexicano',
  inglés: 'Inglés',
  italiano: 'Italiano',
  kawesqar: 'Kawésqar',
  mapuche: 'Mapuche',
  maya: 'Maya',
  nahua: 'Náhuatl',
  polinésico: 'Polinésico',
  portugués: 'Portugués',
  quechua: 'Quechua',
  'quechua o aimara': 'Quechua o aymara',
  'rapa nui': 'Rapa Nui',
  romané: 'Romané',
  selknam: "Selk'nam",
  taíno: 'Taíno',
};

/**
 * Available source dictionaries for word entries.
 * Each dictionary has a code value and display label.
 */
export const DICCIONARIES = [
  { value: 'duech', label: 'DUECh' },
  { value: 'difruech', label: 'DIFRUECh' },
  { value: 'dfp', label: 'DFP' },
  { value: 'damer', label: 'Damer' },
  { value: 'm2015', label: 'María Moliner 2015' },
];

/**
 * Sorts record keys alphabetically by their Spanish labels.
 *
 * @param source - Record with code-to-label mappings
 * @returns Array of keys sorted by their label values
 * @internal
 */
function sortKeysByLabel(source: Record<string, string>): string[] {
  return Object.entries(source)
    .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB, 'es'))
    .map(([key]) => key);
}

/**
 * Grammatical category codes sorted alphabetically by Spanish label.
 * Pre-computed for use in filter dropdowns.
 */
export const PREDEFINED_GRAMMATICAL_CATEGORY_FILTERS = sortKeysByLabel(GRAMMATICAL_CATEGORIES);

/**
 * Origin/etymology codes sorted alphabetically by Spanish label.
 * Pre-computed for use in filter dropdowns.
 */
export const PREDEFINED_ORIGIN_FILTERS = sortKeysByLabel(ORIGINS);

/**
 * Available word status options for editorial workflow.
 * Defines the lifecycle stages of a dictionary entry.
 */
export const STATUS_OPTIONS = [
  { value: 'imported', label: 'Importado' },
  { value: 'included', label: 'Incorporado' },
  { value: 'preredacted', label: 'Prerredactada' },
  { value: 'redacted', label: 'Redactado' },
  { value: 'reviewed', label: 'Revisado por comisión' },
  { value: 'published', label: 'Publicado' },
  { value: 'archaic', label: 'Arcaico' },
  { value: 'quarantined', label: 'Cuarentena' },
];
