import curatedBreedList from '../data/curated-breeds.json';
import { flattenBreeds } from '../domain/quiz.js';

export const DOG_API_BASE_URL = 'https://dog.ceo/api';

export function createApiError(code, message, cause) {
  return {
    code,
    message,
    ...(cause === undefined ? {} : { cause }),
  };
}

export async function fetchQuizBreedList() {
  return curatedBreedList.map((entry) => {
    return {
      ...entry,
      acceptedAnswers: Array.isArray(entry.acceptedAnswers)
        ? [...entry.acceptedAnswers]
        : [],
    };
  });
}

export async function fetchBreedList(fetchImpl = globalThis.fetch) {
  const data = await requestDogApi('/breeds/list/all', fetchImpl);

  if (!data.message || typeof data.message !== 'object' || Array.isArray(data.message)) {
    throw createApiError('INVALID_RESPONSE', 'Invalid breed list response');
  }

  return flattenBreeds(data.message);
}

export async function fetchRandomImageByBreed(entry, fetchImpl = globalThis.fetch) {
  if (!entry || typeof entry !== 'object' || typeof entry.breed !== 'string') {
    throw createApiError('INVALID_RESPONSE', 'Invalid breed entry');
  }

  const path = entry.subBreed
    ? `/breed/${entry.breed}/${entry.subBreed}/images/random`
    : `/breed/${entry.breed}/images/random`;
  const data = await requestDogApi(path, fetchImpl);

  if (typeof data.message !== 'string' || !data.message) {
    throw createApiError('INVALID_RESPONSE', 'Invalid image response');
  }

  return {
    imageUrl: data.message,
  };
}

async function requestDogApi(path, fetchImpl) {
  const resolvedFetch = getFetchImplementation(fetchImpl);
  let response;

  try {
    response = await resolvedFetch(`${DOG_API_BASE_URL}${path}`);
  } catch (error) {
    throw createApiError('NETWORK_ERROR', 'Network request failed', error);
  }

  if (!response?.ok) {
    throw createApiError('HTTP_ERROR', 'Dog API request failed', response?.status);
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw createApiError('INVALID_RESPONSE', 'Failed to parse API response', error);
  }

  if (data?.status !== 'success') {
    throw createApiError('DOG_API_ERROR', data?.message || 'Dog API returned an error');
  }

  return data;
}

function getFetchImplementation(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw createApiError('NETWORK_ERROR', 'Fetch API is not available');
  }

  return fetchImpl;
}
