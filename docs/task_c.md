# C 담당 작업 가이드

이 문서는 현재 저장소 상태를 기준으로 C 담당(App / Service / Domain)이 해야 할 작업을 명확하게 고정하기 위한 문서입니다.

현재 레포의 실제 구현 위치는 루트 `src/`가 아니라 아래 경로입니다.

- `mini-react-dom-diff/src/app.js`
- `mini-react-dom-diff/src/services/api.js`
- `mini-react-dom-diff/src/domain/quiz.js`
- `mini-react-dom-diff/src/domain/normalize.js`

## 1. C 담당 범위

- 루트 `App` 상태 설계 및 phase 전이 구현
- Dog CEO API 서비스 계층 구현
- breed 목록 평탄화와 문제 생성 로직 구현
- 정답 입력 정규화와 정답 판정 구현
- 제출 후 피드백 표시, 다음 버튼 클릭 이동 흐름 구현
- 서비스/도메인/App 테스트 작성

## 2. 이번 작업의 고정 계약

- 상태는 `App` 루트에만 둔다.
- 자식 화면 함수는 local state 없이 props만 받는 pure function으로 유지한다.
- 컴포넌트에서 직접 `fetch()`를 호출하지 않는다.
- 외부 API 호출은 `src/services/api.js`에서만 처리한다.
- 정답 판정은 이미지 URL이 아니라 `answer.label` 기준 정규화 비교로 처리한다.
- 문제 이동은 자동 전환이 아니라 `다음 버튼 클릭`으로 처리한다.

## 3. 구현 파일별 목표

### `mini-react-dom-diff/src/domain/normalize.js`

- `normalizeAnswer(input)` 구현
- trim, 소문자화, 연속 공백 정리, 하이픈/공백 차이 완화

### `mini-react-dom-diff/src/domain/quiz.js`

- `flattenBreeds(message)` 구현
- `BreedEntry` 생성 규칙 구현
- 랜덤 정답 선택 함수 구현
- `buildQuestion(answer, imageUrl, id)` 구현
- `createQuestion(breedList, fetchRandomImageByBreed, options)` 구현
- `isCorrectAnswer(userAnswer, answer)` 구현
- 점수/정답률 계산 보조 함수 구현

### `mini-react-dom-diff/src/services/api.js`

- `fetchBreedList()` 구현
- `fetchRandomImageByBreed(entry)` 구현
- Dog CEO API 응답 검증 구현
- 일관된 `ApiError` 형태 생성

### `mini-react-dom-diff/src/app.js`

- App 루트 상태 구현
- 초기 breed 목록 로드용 `useEffect([])` 구현
- 문제 로드용 `useEffect(...)` 구현
- `startQuiz`, `submitAnswer`, `goToNextQuestion`, `restartQuiz` 구현
- 현재 런타임 계약에 맞는 vnode 기반 화면 구현
- D가 나중에 분리할 수 있도록 화면 함수는 내부 pure function 형태로 유지

## 4. 테스트 범위

- `fetchBreedList()` 정상/실패 테스트
- `fetchRandomImageByBreed()` URL 분기/실패 테스트
- `flattenBreeds()` 테스트
- `normalizeAnswer()` 테스트
- `isCorrectAnswer()` 테스트
- `createQuestion()` 문제 생성 흐름 테스트
- App 흐름 테스트
  - 시작 화면
  - 퀴즈 시작
  - 입력
  - 제출
  - 피드백 표시
  - 다음 버튼 이동
  - 마지막 문제 후 결과 화면

## 5. 구현 순서

1. `normalize.js`
2. `quiz.js`
3. `api.js`
4. `app.js`
5. `tests/quiz.test.js`
6. `tests/app.test.js`
7. 전체 테스트 실행

## 6. 이번 작업의 설계 가정

- `flattenBreeds()`는 도메인 로직으로 보고 `src/domain/quiz.js`에 둔다.
- `src/services/api.js`는 `flattenBreeds()`를 사용해 최종 `BreedEntry[]`를 반환한다.
- UI 컴포넌트 파일은 아직 없으므로, 현재 단계에서는 `app.js` 내부에 pure function 화면 함수를 둔다.
- 나중에 D 담당이 `src/components/*`로 분리할 수 있도록 props 기반 구조를 유지한다.

## 7. 완료 기준

- C 소유 파일이 모두 생성되어 있다.
- 테스트가 통과한다.
- App 흐름이 문서 계약과 일치한다.
- D가 붙일 때 필요한 상태/핸들러/props 경계가 명확하다.

## 8. 직접 테스트하는 방법

현재 C 작업 코드는 `mini-react-dom-diff/` 아래에 구현되어 있습니다.

### 8.1 자동 테스트 실행

`mini-react-dom-diff` 폴더로 이동한 뒤 아래 명령을 실행합니다.

```bash
cd mini-react-dom-diff
npm install
npm test
```

확인할 것:

- `tests/quiz.test.js` 통과
- `tests/app.test.js` 통과
- 전체 테스트가 모두 passed 상태인지 확인

### 8.2 빌드 확인

런타임/앱 코드가 빌드 가능한지도 함께 확인합니다.

```bash
cd mini-react-dom-diff
npm run build
```

확인할 것:

- build가 에러 없이 끝나는지
- `dist/` 출력이 생성되는지

### 8.3 수동 확인 포인트

현재 저장소에는 아직 실제 브라우저 실행용 `main.js`, `index.html`, `src/components/*` 연결이 없습니다.
그래서 C 작업의 수동 확인은 아래 기준으로 보면 됩니다.

1. `src/app.js` 흐름 확인
2. `tests/app.test.js`가 검증하는 시나리오와 코드가 일치하는지 확인
3. `src/services/api.js`와 `src/domain/*` 로직이 문서 계약과 일치하는지 확인

### 8.4 App 흐름을 코드로 확인할 때 볼 순서

1. `createInitialAppState()`
2. 첫 번째 `useEffect`
   - breed 목록 로드
3. 두 번째 `useEffect`
   - 문제 로드
4. `startQuiz()`
5. `submitAnswer()`
6. `goToNextQuestion()`
7. `restartQuiz()`

### 8.5 직접 확인해야 하는 동작 체크리스트

- 시작 화면에서 breed 목록 로드 상태가 보이는지
- 시작 버튼 클릭 후 퀴즈 화면으로 이동하는지
- 이미지와 입력칸이 표시되는지
- 입력 후 제출하면 정답/오답 피드백이 보이는지
- 피드백 이후 `다음 문제` 또는 `결과 보기` 버튼이 보이는지
- 마지막 문제 뒤 결과 화면으로 이동하는지
- 결과 화면에서 점수와 정답률이 계산되는지
- 다시 하기 시 초기 상태로 돌아가는지

### 8.6 현재 한계

- D 담당 UI 컴포넌트 분리가 아직 안 되어 있어서 화면은 `src/app.js` 내부 pure function으로 구성되어 있습니다.
- 실제 브라우저에서 앱을 띄우는 엔트리 파일은 아직 없습니다.
- 따라서 지금은 `npm test`가 가장 정확한 직접 검증 방법입니다.
