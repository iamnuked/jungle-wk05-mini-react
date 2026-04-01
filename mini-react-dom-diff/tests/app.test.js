import { App } from '../src/app.js';
import { createRoot } from '../src/mini-react/index.js';

function flushAsyncWork(iterations = 3) {
  return (async () => {
    for (let index = 0; index < iterations; index += 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  })();
}

async function waitFor(check, attempts = 20) {
  for (let index = 0; index < attempts; index += 1) {
    if (check()) {
      return;
    }

    await flushAsyncWork(1);
  }

  throw new Error('waitFor timeout');
}

function createSequenceRandom(values) {
  let index = 0;

  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

describe('Dog Breed Quiz App', () => {
  it('moves through submit -> feedback -> next button -> result flow', async () => {
    const breedList = [
      {
        key: 'pug',
        breed: 'pug',
        subBreed: null,
        label: 'Pug',
      },
      {
        key: 'bulldog-french',
        breed: 'bulldog',
        subBreed: 'french',
        label: 'French Bulldog',
      },
    ];
    const api = {
      fetchBreedList: vi.fn(async () => breedList),
      fetchRandomImageByBreed: vi.fn(async (entry) => {
        return {
          imageUrl: `https://images.example/${entry.key}.jpg`,
        };
      }),
    };
    const container = document.createElement('div');
    const root = createRoot(App, container, {
      api,
      initialTotalQuestions: 2,
      totalQuestionOptions: [2, 5],
      random: createSequenceRandom([0, 0.99]),
    });

    root.mount();

    await waitFor(() => container.textContent.includes('사용 가능한 견종 수: 2'));

    expect(api.fetchBreedList).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('사용 가능한 견종 수: 2');

    container.querySelector('[data-role="start-quiz"]').click();

    await waitFor(() => container.querySelector('[data-role="submit-answer"]'));

    expect(api.fetchRandomImageByBreed).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('문제 1 / 2');

    const firstInput = container.querySelector('input[name="answer"]');
    firstInput.value = 'pug';
    firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    container.querySelector('[data-role="submit-answer"]').click();

    expect(container.textContent).toContain('정답입니다.');
    expect(container.querySelector('[data-role="next-question"]').textContent).toBe('다음 문제');

    container.querySelector('[data-role="next-question"]').click();

    await waitFor(() => container.querySelector('input[name="answer"]'));

    expect(api.fetchRandomImageByBreed).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('문제 2 / 2');

    const secondInput = container.querySelector('input[name="answer"]');
    secondInput.value = 'not correct';
    secondInput.dispatchEvent(new Event('input', { bubbles: true }));
    container.querySelector('[data-role="submit-answer"]').click();

    expect(container.textContent).toContain('오답입니다. 정답: French Bulldog');
    expect(container.querySelector('[data-role="next-question"]').textContent).toBe('결과 보기');

    container.querySelector('[data-role="next-question"]').click();

    expect(container.textContent).toContain('최종 결과');
    expect(container.textContent).toContain('점수 1 / 2');
    expect(container.textContent).toContain('정답률 50%');
  });
});
