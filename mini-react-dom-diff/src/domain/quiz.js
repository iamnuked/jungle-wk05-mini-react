import { normalizeAnswer } from './normalize.js';

export function flattenBreeds(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('flattenBreeds는 breed 객체를 받아야 합니다.');
  }

  const entries = [];

  for (const [breed, subBreeds] of Object.entries(message)) {
    if (!Array.isArray(subBreeds)) {
      throw new Error(`"${breed}"의 subBreed 목록은 배열이어야 합니다.`);
    }

    if (subBreeds.length === 0) {
      entries.push(createBreedEntry(breed, null));
      continue;
    }

    for (const subBreed of subBreeds) {
      entries.push(createBreedEntry(breed, subBreed));
    }
  }

  return entries;
}

export function pickRandomBreedEntry(breedList, random = Math.random) {
  if (!Array.isArray(breedList) || breedList.length === 0) {
    throw new Error('breedList는 비어 있지 않은 배열이어야 합니다.');
  }

  const index = Math.floor(random() * breedList.length);
  return breedList[Math.max(0, Math.min(index, breedList.length - 1))];
}

export function buildQuestion(answer, imageUrl, id = 'q-1') {
  if (!answer || typeof answer !== 'object') {
    throw new Error('buildQuestion의 answer는 BreedEntry여야 합니다.');
  }

  if (typeof imageUrl !== 'string' || !imageUrl) {
    throw new Error('buildQuestion의 imageUrl은 비어 있지 않은 문자열이어야 합니다.');
  }

  return {
    id,
    answer,
    imageUrl,
  };
}

export async function createQuestion(
  breedList,
  fetchRandomImageByBreed,
  options = {},
) {
  if (typeof fetchRandomImageByBreed !== 'function') {
    throw new Error('createQuestion은 fetchRandomImageByBreed 함수를 받아야 합니다.');
  }

  const questionNumber = options.questionNumber ?? 1;
  const random = options.random ?? Math.random;
  const answer = options.answer ?? pickRandomBreedEntry(breedList, random);
  const image = await fetchRandomImageByBreed(answer);

  if (!image || typeof image.imageUrl !== 'string') {
    throw new Error('fetchRandomImageByBreed는 { imageUrl } 형태를 반환해야 합니다.');
  }

  return buildQuestion(answer, image.imageUrl, `q-${questionNumber}`);
}

export function isCorrectAnswer(userAnswer, answer) {
  const answerLabel = typeof answer === 'string' ? answer : answer?.label;

  if (typeof answerLabel !== 'string' || !answerLabel) {
    return false;
  }

  return normalizeAnswer(userAnswer) === normalizeAnswer(answerLabel);
}

export function calculateAccuracy(score, totalQuestions) {
  if (!totalQuestions) {
    return 0;
  }

  return Math.round((score / totalQuestions) * 100);
}

function createBreedEntry(breed, subBreed) {
  return {
    key: subBreed ? `${breed}-${subBreed}` : breed,
    breed,
    subBreed,
    label: createBreedLabel(breed, subBreed),
  };
}

function createBreedLabel(breed, subBreed) {
  if (subBreed) {
    return `${formatBreedToken(subBreed)} ${formatBreedToken(breed)}`;
  }

  return formatBreedToken(breed);
}

function formatBreedToken(value) {
  return String(value)
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}
