import { useEffect, useMemo, useState, render } from './mini-react/index.js';
import { calculateAccuracy, createQuestion, isCorrectAnswer } from './domain/quiz.js';
import { fetchBreedList, fetchRandomImageByBreed } from './services/api.js';

export const DEFAULT_TOTAL_QUESTION_OPTIONS = [3, 5, 10];

const DEFAULT_API = {
  fetchBreedList,
  fetchRandomImageByBreed,
};

export function createInitialAppState(overrides = {}) {
  return {
    phase: 'start',
    totalQuestions: 5,
    currentQuestionIndex: 0,
    breedList: [],
    currentQuestion: null,
    userAnswer: '',
    feedback: null,
    score: 0,
    isLoading: true,
    error: null,
    ...overrides,
  };
}

export function App(props = {}) {
  const api = props.api ?? DEFAULT_API;
  const random = props.random ?? Math.random;
  const questionFactory = props.questionFactory ?? createQuestion;
  const totalQuestionOptions = props.totalQuestionOptions ?? DEFAULT_TOTAL_QUESTION_OPTIONS;
  const [state, setState] = useState(() => {
    return createInitialAppState({
      totalQuestions: props.initialTotalQuestions ?? 5,
    });
  });

  const accuracy = useMemo(() => {
    return calculateAccuracy(state.score, state.totalQuestions);
  }, [state.score, state.totalQuestions]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const breedList = await api.fetchBreedList();

        if (cancelled) {
          return;
        }

        setState((current) => {
          return {
            ...current,
            breedList,
            isLoading: false,
            error: null,
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((current) => {
          return {
            ...current,
            isLoading: false,
            error: formatAppError(error),
          };
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (state.phase !== 'quiz' || state.currentQuestion !== null || state.breedList.length === 0) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const question = await questionFactory(
          state.breedList,
          api.fetchRandomImageByBreed,
          {
            questionNumber: state.currentQuestionIndex + 1,
            random,
          },
        );

        if (cancelled) {
          return;
        }

        setState((current) => {
          return {
            ...current,
            currentQuestion: question,
            userAnswer: '',
            feedback: null,
            isLoading: false,
            error: null,
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((current) => {
          return {
            ...current,
            isLoading: false,
            error: formatAppError(error),
          };
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    api,
    questionFactory,
    random,
    state.phase,
    state.currentQuestion,
    state.currentQuestionIndex,
    state.breedList,
  ]);

  function startQuiz() {
    if (state.isLoading || state.breedList.length === 0) {
      return;
    }

    setState((current) => {
      return {
        ...current,
        phase: 'quiz',
        currentQuestionIndex: 0,
        currentQuestion: null,
        userAnswer: '',
        feedback: null,
        score: 0,
        isLoading: true,
        error: null,
      };
    });
  }

  function submitAnswer() {
    if (!state.currentQuestion || state.feedback !== null) {
      return;
    }

    const nextFeedback = isCorrectAnswer(state.userAnswer, state.currentQuestion.answer)
      ? 'correct'
      : 'wrong';

    setState((current) => {
      return {
        ...current,
        feedback: nextFeedback,
        score: nextFeedback === 'correct' ? current.score + 1 : current.score,
        error: null,
      };
    });
  }

  function goToNextQuestion() {
    if (state.feedback === null) {
      return;
    }

    const isLastQuestion = state.currentQuestionIndex + 1 >= state.totalQuestions;

    if (isLastQuestion) {
      setState((current) => {
        return {
          ...current,
          phase: 'result',
          currentQuestion: null,
          userAnswer: '',
          feedback: null,
          isLoading: false,
          error: null,
        };
      });
      return;
    }

    setState((current) => {
      return {
        ...current,
        phase: 'quiz',
        currentQuestionIndex: current.currentQuestionIndex + 1,
        currentQuestion: null,
        userAnswer: '',
        feedback: null,
        isLoading: true,
        error: null,
      };
    });
  }

  function restartQuiz() {
    setState((current) => {
      return createInitialAppState({
        totalQuestions: current.totalQuestions,
        breedList: current.breedList,
        isLoading: false,
      });
    });
  }

  function handleQuestionCountChange(event) {
    const nextValue = Number(event?.target?.value);

    if (!Number.isInteger(nextValue) || nextValue <= 0) {
      return;
    }

    setState((current) => {
      return {
        ...current,
        totalQuestions: nextValue,
      };
    });
  }

  function handleAnswerInput(event) {
    const nextValue = event?.target?.value ?? '';

    setState((current) => {
      return {
        ...current,
        userAnswer: nextValue,
      };
    });
  }

  const screenProps = {
    state,
    accuracy,
    totalQuestionOptions,
    onQuestionCountChange: handleQuestionCountChange,
    onStart: startQuiz,
    onAnswerInput: handleAnswerInput,
    onSubmit: submitAnswer,
    onNext: goToNextQuestion,
    onRestart: restartQuiz,
  };

  return h('main', {
    class: 'app-shell',
    'data-phase': state.phase,
  }, [
    h('header', { class: 'app-header' }, [
      h('h1', {}, ['Dog Breed Quiz']),
      h('p', {}, ['Mini React runtime 위에서 동작하는 견종 맞히기 앱입니다.']),
    ]),
    renderPhaseScreen(screenProps),
  ]);
}

export function mountApp(container, props = {}) {
  return render(App, container, props);
}

function renderPhaseScreen(props) {
  switch (props.state.phase) {
    case 'quiz':
      return QuizScreen(props);
    case 'result':
      return ResultScreen(props);
    case 'start':
    default:
      return StartScreen(props);
  }
}

function StartScreen(props) {
  const { state, totalQuestionOptions, onQuestionCountChange, onStart } = props;
  const canStart = !state.isLoading && state.breedList.length > 0;

  return h('section', {
    class: 'screen screen-start',
    'data-screen': 'start',
  }, [
    h('p', { 'data-role': 'breed-status' }, [
      state.isLoading
        ? '견종 목록을 불러오는 중입니다.'
        : `사용 가능한 견종 수: ${state.breedList.length}`,
    ]),
    renderError(state.error),
    h('label', { class: 'field' }, [
      h('span', {}, ['문제 수 선택']),
      h('select', {
        name: 'questionCount',
        value: String(state.totalQuestions),
        onChange: onQuestionCountChange,
      }, totalQuestionOptions.map((count) => {
        return h('option', { value: String(count) }, [String(count)]);
      })),
    ]),
    h('button', {
      type: 'button',
      'data-role': 'start-quiz',
      onClick: onStart,
      disabled: canStart ? undefined : '',
    }, ['퀴즈 시작']),
  ]);
}

function QuizScreen(props) {
  const { state, onAnswerInput, onSubmit, onNext } = props;
  const questionNumber = state.currentQuestionIndex + 1;
  const isLastQuestion = questionNumber >= state.totalQuestions;

  return h('section', {
    class: 'screen screen-quiz',
    'data-screen': 'quiz',
  }, [
    h('div', { class: 'scoreboard' }, [
      h('p', { 'data-role': 'question-progress' }, [
        `문제 ${questionNumber} / ${state.totalQuestions}`,
      ]),
      h('p', { 'data-role': 'score-progress' }, [
        `현재 점수 ${state.score}`,
      ]),
    ]),
    renderError(state.error),
    state.isLoading || !state.currentQuestion
      ? h('p', { 'data-role': 'question-loading' }, ['문제를 불러오는 중입니다.'])
      : h('div', { class: 'question-body' }, [
          h('img', {
            src: state.currentQuestion.imageUrl,
            alt: '강아지 문제 이미지',
            'data-role': 'quiz-image',
          }),
          h('label', { class: 'field' }, [
            h('span', {}, ['견종명을 입력하세요']),
            h('input', {
              type: 'text',
              name: 'answer',
              value: state.userAnswer,
              onInput: onAnswerInput,
            }),
          ]),
          h('button', {
            type: 'button',
            'data-role': 'submit-answer',
            onClick: onSubmit,
            disabled: state.feedback !== null ? '' : undefined,
          }, ['제출']),
          renderFeedback(state),
          state.feedback !== null
            ? h('button', {
                type: 'button',
                'data-role': 'next-question',
                onClick: onNext,
              }, [isLastQuestion ? '결과 보기' : '다음 문제'])
            : null,
        ]),
  ]);
}

function ResultScreen(props) {
  const { state, accuracy, onRestart } = props;

  return h('section', {
    class: 'screen screen-result',
    'data-screen': 'result',
  }, [
    h('h2', {}, ['최종 결과']),
    h('p', { 'data-role': 'final-score' }, [
      `점수 ${state.score} / ${state.totalQuestions}`,
    ]),
    h('p', { 'data-role': 'final-accuracy' }, [
      `정답률 ${accuracy}%`,
    ]),
    h('button', {
      type: 'button',
      'data-role': 'restart-quiz',
      onClick: onRestart,
    }, ['다시 하기']),
  ]);
}

function renderFeedback(state) {
  if (!state.currentQuestion || state.feedback === null) {
    return null;
  }

  const message = state.feedback === 'correct'
    ? '정답입니다.'
    : `오답입니다. 정답: ${state.currentQuestion.answer.label}`;

  return h('p', {
    'data-role': 'feedback-message',
    'data-feedback': state.feedback,
  }, [message]);
}

function renderError(errorMessage) {
  if (!errorMessage) {
    return null;
  }

  return h('p', {
    'data-role': 'error-message',
  }, [errorMessage]);
}

function formatAppError(error) {
  switch (error?.code) {
    case 'NETWORK_ERROR':
      return '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
    case 'DOG_API_ERROR':
      return '강아지 정보를 불러오지 못했습니다.';
    case 'INVALID_RESPONSE':
      return '응답 형식이 올바르지 않습니다.';
    case 'HTTP_ERROR':
      return '요청 처리 중 오류가 발생했습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}

function h(tag, attrs = {}, children = []) {
  return {
    type: 'element',
    tag,
    attrs,
    children: normalizeChildren(children),
  };
}

function text(value) {
  return {
    type: 'text',
    value: String(value),
  };
}

function normalizeChildren(children) {
  const normalized = [];

  for (const child of children) {
    if (child === null || child === undefined || child === false) {
      continue;
    }

    if (Array.isArray(child)) {
      normalized.push(...normalizeChildren(child));
      continue;
    }

    if (typeof child === 'string' || typeof child === 'number') {
      normalized.push(text(child));
      continue;
    }

    normalized.push(child);
  }

  return normalized;
}
