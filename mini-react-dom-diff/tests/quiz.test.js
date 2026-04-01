import { normalizeAnswer } from '../src/domain/normalize.js';
import {
  buildQuestion,
  createQuestion,
  flattenBreeds,
  isCorrectAnswer,
} from '../src/domain/quiz.js';
import {
  DOG_API_BASE_URL,
  fetchBreedList,
  fetchQuizBreedList,
  fetchRandomImageByBreed,
} from '../src/services/api.js';

const BREED_MESSAGE = {
  bulldog: ['french'],
  pug: [],
};

describe('Domain and service layer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizeAnswer trims spaces and treats hyphen/space variants equally', () => {
    expect(normalizeAnswer(' French-Bulldog  ')).toBe('frenchbulldog');
    expect(normalizeAnswer(' 토이-푸들 ')).toBe('토이푸들');
  });

  it('flattenBreeds converts Dog CEO breed objects into BreedEntry[]', () => {
    expect(flattenBreeds(BREED_MESSAGE)).toEqual([
      {
        key: 'bulldog-french',
        breed: 'bulldog',
        subBreed: 'french',
        label: 'French Bulldog',
      },
      {
        key: 'pug',
        breed: 'pug',
        subBreed: null,
        label: 'Pug',
      },
    ]);
  });

  it('isCorrectAnswer compares user input against normalized answer labels', () => {
    const answer = {
      key: 'bulldog-french',
      breed: 'bulldog',
      subBreed: 'french',
      label: 'French Bulldog',
      acceptedAnswers: ['French Bulldog', '프렌치 불독', 'Bulldog', '불독'],
    };

    expect(isCorrectAnswer(' french-bulldog ', answer)).toBe(true);
    expect(isCorrectAnswer('프렌치불독', answer)).toBe(true);
    expect(isCorrectAnswer('불독', answer)).toBe(true);
    expect(isCorrectAnswer('english bulldog', answer)).toBe(false);
  });

  it('accepts the parent breed name for curated sub-breed answers', () => {
    const answer = {
      key: 'poodle-toy',
      breed: 'poodle',
      subBreed: 'toy',
      label: 'Toy Poodle',
      acceptedAnswers: ['Toy Poodle', '토이 푸들', 'Poodle', '푸들'],
    };

    expect(isCorrectAnswer('푸들', answer)).toBe(true);
    expect(isCorrectAnswer('poodle', answer)).toBe(true);
    expect(isCorrectAnswer('토이푸들', answer)).toBe(true);
  });

  it('fetchQuizBreedList returns the curated local quiz breeds', async () => {
    const breedList = await fetchQuizBreedList();

    expect(breedList).toHaveLength(30);
    expect(breedList).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'poodle-toy',
        breed: 'poodle',
        subBreed: 'toy',
        labelKo: '토이 푸들',
      }),
      expect.objectContaining({
        key: 'terrier-yorkshire',
        breed: 'terrier',
        subBreed: 'yorkshire',
      }),
    ]));
  });

  it('createQuestion selects an answer and combines it with the fetched image', async () => {
    const breedList = flattenBreeds(BREED_MESSAGE);
    const fetchImage = vi.fn(async (entry) => {
      return {
        imageUrl: `https://images.example/${entry.key}.jpg`,
      };
    });

    const question = await createQuestion(breedList, fetchImage, {
      questionNumber: 2,
      random: () => 0.99,
    });

    expect(fetchImage).toHaveBeenCalledWith(breedList[1]);
    expect(question).toEqual(
      buildQuestion(
        breedList[1],
        'https://images.example/pug.jpg',
        'q-2',
      ),
    );
  });

  it('fetchBreedList validates the response and returns flattened BreedEntry[]', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        async json() {
          return {
            status: 'success',
            message: BREED_MESSAGE,
          };
        },
      };
    });

    const breedList = await fetchBreedList(fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(`${DOG_API_BASE_URL}/breeds/list/all`);
    expect(breedList[0].label).toBe('French Bulldog');
    expect(breedList[1].label).toBe('Pug');
  });

  it('fetchBreedList throws INVALID_RESPONSE for malformed payloads', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        async json() {
          return {
            status: 'success',
            message: 'not-an-object',
          };
        },
      };
    });

    await expect(fetchBreedList(fetchMock)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('fetchRandomImageByBreed builds the right URL for breeds and sub-breeds', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        async json() {
          return {
            status: 'success',
            message: 'https://images.example/random.jpg',
          };
        },
      };
    });

    const breedOnlyEntry = {
      key: 'pug',
      breed: 'pug',
      subBreed: null,
      label: 'Pug',
    };
    const subBreedEntry = {
      key: 'bulldog-french',
      breed: 'bulldog',
      subBreed: 'french',
      label: 'French Bulldog',
    };

    await fetchRandomImageByBreed(breedOnlyEntry, fetchMock);
    await fetchRandomImageByBreed(subBreedEntry, fetchMock);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${DOG_API_BASE_URL}/breed/pug/images/random`,
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${DOG_API_BASE_URL}/breed/bulldog/french/images/random`,
    );
  });

  it('fetchRandomImageByBreed throws DOG_API_ERROR when the API returns an error payload', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        async json() {
          return {
            status: 'error',
            message: 'Breed not found',
          };
        },
      };
    });

    await expect(fetchRandomImageByBreed({
      key: 'unknown',
      breed: 'unknown',
      subBreed: null,
      label: 'Unknown',
    }, fetchMock)).rejects.toMatchObject({
      code: 'DOG_API_ERROR',
    });
  });
});
