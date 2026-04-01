import { useEffect, useMemo, useState, render } from './mini-react/index.js';
import {
  calculateAccuracy,
  createQuestion,
  isCorrectAnswer,
} from './domain/quiz.js';
import {
  fetchBreedList,
  fetchRandomImageByBreed,
} from './services/api.js';

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

  const breedPreview = useMemo(() => {
    if (state.breedList.length === 0) {
      return [];
    }

    const stride = Math.max(1, Math.floor(state.breedList.length / 6));
    const preview = [];

    for (let index = 0; index < state.breedList.length && preview.length < 6; index += stride) {
      preview.push(state.breedList[index].label);
    }

    return preview;
  }, [state.breedList]);

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
    breedPreview,
    totalQuestionOptions,
    onQuestionCountChange: handleQuestionCountChange,
    onStart: startQuiz,
    onAnswerInput: handleAnswerInput,
    onSubmit: submitAnswer,
    onNext: goToNextQuestion,
    onRestart: restartQuiz,
  };

  return h('div', { class: 'demo-shell' }, [
    h('div', { class: 'demo-orb demo-orb-a', 'aria-hidden': 'true' }, []),
    h('div', { class: 'demo-orb demo-orb-b', 'aria-hidden': 'true' }, []),
    h('div', { class: 'demo-orb demo-orb-c', 'aria-hidden': 'true' }, []),
    h('main', {
      class: 'app-shell',
      'data-phase': state.phase,
    }, [
      h('header', { class: 'masthead' }, [
        h('div', { class: 'masthead-copy' }, [
          h('p', { class: 'eyebrow' }, ['Mini React Demo']),
          h('h1', {}, ['Dog Archive Quiz']),
          h('p', { class: 'masthead-description' }, [
            'Dog CEO API와 mini-react runtime을 사용해, 강아지 이미지를 보고 견종명을 맞히는 데모 페이지입니다.',
          ]),
        ]),
        h('div', { class: 'masthead-meta' }, [
          h('span', { class: 'status-pill' }, [getPhaseLabel(state.phase)]),
          h('p', { class: 'meta-copy' }, [
            state.isLoading && state.phase === 'start'
              ? '견종 목록 동기화 중'
              : `준비된 견종 ${state.breedList.length}개`,
          ]),
        ]),
      ]),
      renderPhaseScreen(screenProps),
    ]),
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
  const {
    state,
    breedPreview,
    totalQuestionOptions,
    onQuestionCountChange,
    onStart,
  } = props;
  const canStart = !state.isLoading && state.breedList.length > 0;

  return h('section', {
    class: 'screen screen-start',
    'data-screen': 'start',
  }, [
    h('div', { class: 'screen-grid start-grid' }, [
      h('div', { class: 'panel-primary' }, [
        h('p', { class: 'section-label' }, ['Warm-up']),
        h('h2', { class: 'screen-title' }, ['강아지 이미지를 보고 견종명을 맞혀보세요.']),
        h('p', { class: 'lead-copy' }, [
          '문서에 맞춘 흐름은 유지하되, 화면은 데모 페이지답게 더 또렷한 레이아웃과 분위기로 구성했습니다.',
        ]),
        h('div', { class: 'stat-grid' }, [
          renderStatCard(
            '견종 목록',
            state.isLoading ? 'syncing' : String(state.breedList.length),
            'mint',
          ),
          renderStatCard(
            '문제 수',
            `${state.totalQuestions} rounds`,
            'gold',
          ),
          renderStatCard(
            '현재 단계',
            'setup',
            'coral',
          ),
        ]),
        h('div', { class: 'field-card' }, [
          h('label', { class: 'field' }, [
            h('span', { class: 'field-label' }, ['문제 수 선택']),
            h('select', {
              class: 'field-select',
              name: 'questionCount',
              value: String(state.totalQuestions),
              onChange: onQuestionCountChange,
            }, totalQuestionOptions.map((count) => {
              return h('option', { value: String(count) }, [`${count}문제`]);
            })),
          ]),
          h('div', { class: 'action-row' }, [
            h('button', {
              class: 'primary-button',
              type: 'button',
              'data-role': 'start-quiz',
              onClick: onStart,
              disabled: canStart ? undefined : '',
            }, [state.isLoading ? '견종 목록 불러오는 중' : '퀴즈 시작']),
          ]),
        ]),
        h('p', {
          class: 'info-copy',
          'data-role': 'breed-status',
        }, [
          state.isLoading
            ? '견종 목록을 불러오는 중입니다.'
            : `사용 가능한 견종 수: ${state.breedList.length}`,
        ]),
        renderError(state.error),
      ]),
      h('aside', { class: 'panel-secondary' }, [
        h('div', { class: 'info-card' }, [
          h('p', { class: 'section-label' }, ['Flow']),
          h('ul', { class: 'flow-list' }, [
            h('li', {}, ['시작 화면에서 문제 수를 고릅니다.']),
            h('li', {}, ['랜덤 강아지 이미지를 보고 견종을 입력합니다.']),
            h('li', {}, ['정답 또는 오답 피드백을 확인합니다.']),
            h('li', {}, ['마지막 문제 뒤 결과 화면으로 이동합니다.']),
          ]),
        ]),
        h('div', { class: 'info-card' }, [
          h('p', { class: 'section-label' }, ['Breed Preview']),
          h('div', { class: 'breed-cloud' }, breedPreview.length > 0
            ? breedPreview.map((label) => {
                return h('span', { class: 'breed-tag' }, [label]);
              })
            : [
                h('p', { class: 'muted-copy' }, ['견종 목록을 준비하는 중입니다.']),
              ]),
        ]),
      ]),
    ]),
  ]);
}

function QuizScreen(props) {
  const { state, onAnswerInput, onSubmit, onNext } = props;
  const questionNumber = state.currentQuestionIndex + 1;
  const isLastQuestion = questionNumber >= state.totalQuestions;
  const progressPercent = Math.round((questionNumber / state.totalQuestions) * 100);

  return h('section', {
    class: 'screen screen-quiz',
    'data-screen': 'quiz',
  }, [
    h('div', { class: 'quiz-grid' }, [
      h('article', { class: 'media-panel' }, [
        h('div', { class: 'panel-topline' }, [
          h('p', { class: 'section-label' }, [`Round ${String(questionNumber).padStart(2, '0')}`]),
          h('span', { class: 'score-chip' }, ['Image Prompt']),
        ]),
        h('div', { class: 'progress-card' }, [
          h('p', {
            class: 'progress-copy',
            'data-role': 'question-progress',
          }, [`문제 ${questionNumber} / ${state.totalQuestions}`]),
          h('p', {
            class: 'score-copy',
            'data-role': 'score-progress',
          }, [`현재 점수 ${state.score}`]),
          h('div', { class: 'progress-bar', 'aria-hidden': 'true' }, [
            h('span', {
              class: 'progress-fill',
              style: `width: ${progressPercent}%;`,
            }, []),
          ]),
        ]),
        state.isLoading || !state.currentQuestion
          ? h('div', { class: 'question-placeholder' }, [
              h('div', { class: 'loading-orb', 'aria-hidden': 'true' }, []),
              h('p', { 'data-role': 'question-loading' }, ['문제를 불러오는 중입니다.']),
            ])
          : h('div', { class: 'question-visual' }, [
              h('img', {
                class: 'quiz-image',
                src: state.currentQuestion.imageUrl,
                alt: '강아지 문제 이미지',
                'data-role': 'quiz-image',
              }),
            ]),
      ]),
      h('article', { class: 'control-panel' }, [
        h('div', { class: 'control-copy' }, [
          h('p', { class: 'section-label' }, ['Guess']),
          h('h2', { class: 'screen-title' }, ['이 강아지의 견종명을 입력해보세요.']),
          h('p', { class: 'lead-copy' }, [
            '입력값은 정규화 비교로 판정됩니다. 대소문자나 하이픈 차이는 크게 신경 쓰지 않아도 됩니다.',
          ]),
        ]),
        renderError(state.error),
        state.isLoading || !state.currentQuestion
          ? h('p', { class: 'muted-copy' }, ['문제가 준비되면 답안을 입력할 수 있습니다.'])
          : h('label', { class: 'field' }, [
              h('span', { class: 'field-label' }, ['견종명을 입력하세요']),
              h('input', {
                class: 'field-input',
                type: 'text',
                name: 'answer',
                value: state.userAnswer,
                onInput: onAnswerInput,
                disabled: state.feedback !== null ? '' : undefined,
                placeholder: '예: French Bulldog',
              }),
            ]),
        state.isLoading || !state.currentQuestion
          ? null
          : h('div', { class: 'action-row' }, [
              h('button', {
                class: 'primary-button',
                type: 'button',
                'data-role': 'submit-answer',
                onClick: onSubmit,
                disabled: state.feedback !== null || state.userAnswer.trim() === '' ? '' : undefined,
              }, ['정답 확인']),
              state.feedback !== null
                ? h('button', {
                    class: 'secondary-button',
                    type: 'button',
                    'data-role': 'next-question',
                    onClick: onNext,
                  }, [isLastQuestion ? '결과 보기' : '다음 문제'])
                : null,
            ]),
        renderFeedback(state),
      ]),
    ]),
  ]);
}

function ResultScreen(props) {
  const { state, accuracy, onRestart } = props;

  return h('section', {
    class: 'screen screen-result',
    'data-screen': 'result',
  }, [
    h('div', { class: 'result-layout' }, [
      h('div', { class: 'result-copy-wrap' }, [
        h('p', { class: 'section-label' }, ['Summary']),
        h('h2', { class: 'screen-title' }, ['최종 결과']),
        h('p', { class: 'lead-copy' }, [
          '시작, 문제 풀이, 피드백, 결과 화면까지 하나의 흐름으로 이어지는 mini-react 데모입니다.',
        ]),
        h('p', {
          class: 'result-copy',
          'data-role': 'final-score',
        }, [`점수 ${state.score} / ${state.totalQuestions}`]),
        h('p', {
          class: 'result-copy',
          'data-role': 'final-accuracy',
        }, [`정답률 ${accuracy}%`]),
      ]),
      h('div', { class: 'score-ring-card' }, [
        h('div', {
          class: 'score-ring',
          style: `--ratio:${accuracy};`,
        }, [
          h('div', { class: 'score-ring-inner' }, [
            h('strong', {}, [`${accuracy}%`]),
            h('span', {}, ['accuracy']),
          ]),
        ]),
      ]),
    ]),
    h('div', { class: 'stat-grid result-stats' }, [
      renderStatCard('최종 점수', `${state.score} / ${state.totalQuestions}`, 'mint'),
      renderStatCard('정답 수', `${state.score} hits`, 'coral'),
      renderStatCard('오답 수', `${state.totalQuestions - state.score} misses`, 'gold'),
    ]),
    h('div', { class: 'action-row' }, [
      h('button', {
        class: 'primary-button',
        type: 'button',
        'data-role': 'restart-quiz',
        onClick: onRestart,
      }, ['다시 하기']),
    ]),
  ]);
}

function renderFeedback(state) {
  if (!state.currentQuestion || state.feedback === null) {
    return null;
  }

  const message = state.feedback === 'correct'
    ? '정답입니다.'
    : `오답입니다. 정답: ${state.currentQuestion.answer.label}`;

  return h('div', {
    class: `feedback-card feedback-${state.feedback}`,
  }, [
    h('p', { class: 'feedback-kicker' }, [
      state.feedback === 'correct' ? 'Correct' : 'Answer Revealed',
    ]),
    h('p', {
      class: 'feedback-message',
      'data-role': 'feedback-message',
      'data-feedback': state.feedback,
    }, [message]),
    h('p', { class: 'feedback-detail' }, [
      state.feedback === 'correct'
        ? '좋아요. 같은 흐름으로 다음 문제도 이어갈 수 있습니다.'
        : `정답 라벨은 ${state.currentQuestion.answer.label} 입니다.`,
    ]),
  ]);
}

function renderError(errorMessage) {
  if (!errorMessage) {
    return null;
  }

  return h('div', { class: 'error-banner' }, [
    h('p', { class: 'error-title' }, ['Notice']),
    h('p', {
      class: 'error-copy',
      'data-role': 'error-message',
    }, [errorMessage]),
  ]);
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

function getPhaseLabel(phase) {
  switch (phase) {
    case 'quiz':
      return 'Live Round';
    case 'result':
      return 'Results';
    case 'start':
    default:
      return 'Setup';
  }
}

function renderStatCard(label, value, tone) {
  return h('div', {
    class: `stat-card tone-${tone}`,
  }, [
    h('span', {}, [label]),
    h('strong', {}, [value]),
  ]);
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
