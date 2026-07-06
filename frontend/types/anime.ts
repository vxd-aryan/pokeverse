// types/anime.ts

export type ContentType = 'TV Series' | 'Movie' | 'Special' | 'OVA' | 'Web Series';

export interface WatchEntry {
  id: string;
  title: string;
  type: ContentType;
  releaseYear: number;
  region: string;
  thumbnail: string;
  description: string;
  chronologicalOrder: number;
}

export interface TVSeries extends WatchEntry {
  type: 'TV Series';
  episodeCount: number;
  seasons: number;           // <-- ADD THIS EXACT LINE
  mainCharacters: string[];
  featuredPokemon: string[];
  villains: string[];
}

export interface Movie extends WatchEntry {
  type: 'Movie';
  runtimeMinutes: number;
  featuredLegendary: string;
  relatedSeriesId: string; // Ties the movie back to the TV series era
}