// lib/animeService.ts
import { CHRONOLOGICAL_WATCH_ORDER, TV_SERIES_REGISTRY, MOVIE_REGISTRY } from './animeData';
import { WatchEntry, TVSeries, Movie } from '@/types/anime';

/**
 * Fetches the master chronological order for the home landing dashboard
 */
export function getChronologicalWatchOrder(): Omit<WatchEntry, "id" | "releaseYear" | "thumbnail">[] {
  return CHRONOLOGICAL_WATCH_ORDER.sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
}
/**
 * Fetches a list of all available TV Series
 */
export function getTVSeriesList(): TVSeries[] {
  return Object.values(TV_SERIES_REGISTRY);
}

/**
 * Fetches a list of all available Movies
 */
export function getMoviesList(): Movie[] {
  return Object.values(MOVIE_REGISTRY);
}

/**
 * Safely fetches a TV Series object by its specific ID string
 */
export function getTVSeriesById(id: string): TVSeries | undefined {
  return TV_SERIES_REGISTRY[id];
}

/**
 * Safely fetches a Movie object by its specific ID string
 */
export function getMovieById(id: string): Movie | undefined {
  return MOVIE_REGISTRY[id];
}

/**
 * Global search function querying across strings inside the repository arrays
 */
export function globalSearchLibrary(query: string): WatchEntry[] {
  const lowercaseQuery = query.toLowerCase();
  if (!lowercaseQuery) return CHRONOLOGICAL_WATCH_ORDER;

  return CHRONOLOGICAL_WATCH_ORDER.filter(item => 
    item.title.toLowerCase().includes(lowercaseQuery) || 
    item.region.toLowerCase().includes(lowercaseQuery) ||
    item.description.toLowerCase().includes(lowercaseQuery)
  );
}