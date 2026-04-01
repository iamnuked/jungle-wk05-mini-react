# C 작업 체크리스트

이 문서는 [`work-allocation.md`](./work-allocation.md)와 [`task_c.md`](./task_c.md)를 기준으로, 현재 저장소에서 C 담당 작업이 실제로 어디까지 완료되었는지 확인한 결과입니다.

검증 기준:

- 파일 존재 여부 확인
- 구현 코드 확인
- 테스트 코드 확인
- `mini-react-dom-diff`에서 `npm test` 통과 여부 확인

검증 일시 기준 현재 상태:

- 테스트 결과: `4 passed`, `22 passed`
- 실제 구현 경로:
  - `mini-react-dom-diff/src/app.js`
  - `mini-react-dom-diff/src/services/api.js`
  - `mini-react-dom-diff/src/domain/quiz.js`
  - `mini-react-dom-diff/src/domain/normalize.js`

## 1. 파일 생성 여부

- [x] `mini-react-dom-diff/src/app.js` 생성
- [x] `mini-react-dom-diff/src/services/api.js` 생성
- [x] `mini-react-dom-diff/src/domain/quiz.js` 생성
- [x] `mini-react-dom-diff/src/domain/normalize.js` 생성

## 2. `work-allocation.md` 기준 확인

### 담당 범위

- [x] `App / Service / Domain` 파일 범위가 실제로 생성되어 있다.

### 핵심 책임

- [x] 루트 `App` 상태 설계가 구현되어 있다.
- [x] `phase` 전이 설계가 구현되어 있다.
- [x] Dog CEO API 서비스 계층이 구현되어 있다.
- [x] breed 목록 평탄화 연결이 구현되어 있다.
- [x] 문제 생성 로직이 구현되어 있다.
- [x] 정답 판정 로직이 구현되어 있다.
- [x] 입력값 정규화가 구현되어 있다.
- [x] 다음 버튼 기반 문제 이동이 구현되어 있다.
- [x] 결과 화면 점수/정답률 계산이 구현되어 있다.

### 완료 기준

- [x] 시작 -> 문제 로드 -> 입력 -> 제출 -> 피드백 -> 다음 버튼 -> 다음 문제/결과 화면 흐름이 동작한다.
- [x] 컴포넌트에서 직접 `fetch()`를 호출하지 않는다.
- [x] 정답 판정이 이미지 URL 파싱이 아니라 `answer.label` 기준 정규화 비교로 동작한다.

### 테스트 기준

- [x] `fetchBreedList()` 테스트가 있다.
- [x] `fetchRandomImageByBreed()` 테스트가 있다.
- [x] `flattenBreeds()` 테스트가 있다.
- [x] `normalizeAnswer()` 테스트가 있다.
- [x] `isCorrectAnswer()` 테스트가 있다.
- [x] 문제 생성 흐름 테스트가 있다.

## 3. `task_c.md` 기준 확인

### C 담당 범위

- [x] 루트 `App` 상태 설계 및 phase 전이 구현
- [x] Dog CEO API 서비스 계층 구현
- [x] breed 목록 평탄화와 문제 생성 로직 구현
- [x] 정답 입력 정규화와 정답 판정 구현
- [x] 제출 후 피드백 표시, 다음 버튼 클릭 이동 흐름 구현
- [x] 서비스/도메인/App 테스트 작성

### 고정 계약

- [x] 상태는 `App` 루트에만 둔다.
- [x] 자식 화면 함수는 local state 없이 props만 받는 pure function 형태를 유지한다.
- [x] 컴포넌트에서 직접 `fetch()`를 호출하지 않는다.
- [x] 외부 API 호출은 `src/services/api.js`에서만 처리한다.
- [x] 정답 판정은 이미지 URL이 아니라 `answer.label` 기준 정규화 비교로 처리한다.
- [x] 문제 이동은 자동 전환이 아니라 `다음 버튼 클릭`으로 처리한다.

### 구현 파일별 목표

#### `mini-react-dom-diff/src/domain/normalize.js`

- [x] `normalizeAnswer(input)` 구현
- [x] trim, 소문자화, 연속 공백 정리, 하이픈/공백 차이 완화 반영

#### `mini-react-dom-diff/src/domain/quiz.js`

- [x] `flattenBreeds(message)` 구현
- [x] `BreedEntry` 생성 규칙 구현
- [x] 랜덤 정답 선택 함수 구현
- [x] `buildQuestion(answer, imageUrl, id)` 구현
- [x] `createQuestion(breedList, fetchRandomImageByBreed, options)` 구현
- [x] `isCorrectAnswer(userAnswer, answer)` 구현
- [x] 점수/정답률 계산 보조 함수 구현

#### `mini-react-dom-diff/src/services/api.js`

- [x] `fetchBreedList()` 구현
- [x] `fetchRandomImageByBreed(entry)` 구현
- [x] Dog CEO API 응답 검증 구현
- [x] 일관된 `ApiError` 형태 생성

#### `mini-react-dom-diff/src/app.js`

- [x] App 루트 상태 구현
- [x] 초기 breed 목록 로드용 `useEffect([])` 구현
- [x] 문제 로드용 `useEffect(...)` 구현
- [x] `startQuiz`, `submitAnswer`, `goToNextQuestion`, `restartQuiz` 구현
- [x] 현재 런타임 계약에 맞는 vnode 기반 화면 구현
- [x] D가 나중에 분리할 수 있도록 화면 함수는 내부 pure function 형태로 유지

### 테스트 범위

- [x] `fetchBreedList()` 정상/실패 테스트
- [x] `fetchRandomImageByBreed()` URL 분기 테스트
- [x] `fetchRandomImageByBreed()` 실패 테스트
- [x] `flattenBreeds()` 테스트
- [x] `normalizeAnswer()` 테스트
- [x] `isCorrectAnswer()` 테스트
- [x] `createQuestion()` 문제 생성 흐름 테스트
- [x] App 시작 화면 테스트
- [x] App 퀴즈 시작 테스트
- [x] App 입력 테스트
- [x] App 제출 테스트
- [x] App 피드백 표시 테스트
- [x] App 다음 버튼 이동 테스트
- [x] App 마지막 문제 후 결과 화면 테스트

### 완료 기준

- [x] C 소유 파일이 모두 생성되어 있다.
- [x] 테스트가 통과한다.
- [x] App 흐름이 문서 계약과 일치한다.
- [x] D가 붙일 때 필요한 상태/핸들러/props 경계가 명확하다.

## 4. 최종 판단

- [x] C 담당 핵심 구현은 현재 기준으로 완료 상태다.
- [x] C 담당 기본 테스트는 통과 상태다.
- [x] 테스트 범위를 문서 기준으로 충족했다.

## 5. 다음 액션

- C 관점에서 즉시 필요한 추가 구현은 크지 않다.
- 남은 실질 작업은 아래 둘 중 하나다.
  - D 담당이 `app.js` 내부 pure function 화면들을 `src/components/*`로 분리하면서 연결
