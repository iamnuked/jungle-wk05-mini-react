# WEEK5 분업 계획 - 4인 협업

이 문서는 [`requirements.md`](./requirements.md), [`architecture.md`](./architecture.md), [`api-spec.md`](./api-spec.md)를 기준으로 4인 팀 분업 계획을 정리한 문서입니다.

## 1. 분업 원칙

- 역할은 기능 기준이 아니라 책임 경계 기준으로 나눈다.
- 각 담당자는 자신이 소유한 폴더와 파일을 우선 책임진다.
- 공용 인터페이스는 초반에 먼저 고정한다.
- UI는 목업으로 먼저 만들 수 있지만, 최종 연결 계약은 `App`과 `domain/services`를 따른다.

## 2. 4인 역할 구성

### A. Mini React Runtime 담당

#### 담당 범위

- `src/mini-react/component.js`
- `src/mini-react/hooks.js`
- `src/mini-react/renderer.js`
- `src/mini-react/index.js`

#### 핵심 책임

- `FunctionComponent` 클래스 구현
- `hooks[]`, `hookIndex`, `currentComponent` 구조 구현
- `mount()` 구현
- `update()` 구현
- `useState` 구현
- `useEffect` 구현
- `useMemo` 구현
- effect 실행 타이밍 정리

#### 완료 기준

- 함수형 컴포넌트를 `FunctionComponent`로 감싸 실행할 수 있어야 한다.
- `setState` 호출 시 루트 rerender가 정상 동작해야 한다.
- `useEffect` deps 비교와 cleanup이 동작해야 한다.
- `useMemo`가 캐싱되어야 한다.

#### 테스트

- `FunctionComponent.mount()` 테스트
- `FunctionComponent.update()` 테스트
- `useState` 상태 유지 테스트
- `useEffect` deps / cleanup 테스트
- `useMemo` 캐싱 테스트

### B. VDOM / Diff / Patch / Event 담당

#### 담당 범위

- `src/mini-react/vdom.js`
- `src/mini-react/diff.js`
- `src/mini-react/patch.js`
- `src/mini-react/event.js`

#### 핵심 책임

- WEEK4 엔진 이식 또는 래핑
- vnode 정규화
- diff / patch 연결
- keyed diff 유지
- 함수형 이벤트 props 처리
- 이벤트 핸들러 등록/해제/교체 처리

#### 완료 기준

- 이전 vnode와 새 vnode를 비교해 변경 부분만 DOM에 반영해야 한다.
- `onClick`, `onInput`, `onSubmit` 같은 이벤트가 정상 동작해야 한다.
- rerender 시 핸들러 교체가 정상 반영되어야 한다.

#### 테스트

- 텍스트 변경 테스트
- props 변경 테스트
- 자식 삽입/삭제 테스트
- keyed 이동 테스트
- 이벤트 핸들러 바인딩 테스트
- 이벤트 핸들러 교체 테스트

### C. App / Service / Domain 담당

#### 담당 범위

- `src/app.js`
- `src/services/api.js`
- `src/domain/quiz.js`
- `src/domain/normalize.js`

#### 핵심 책임

- 루트 App 상태 설계
- phase 전이 설계
- Dog CEO API 연동
- breed 목록 평탄화 연결
- 문제 생성
- 정답 판정
- 입력값 정규화
- 다음 문제 이동
- 결과 화면 상태 계산

#### 완료 기준

- 시작 -> 문제 로드 -> 입력 -> 제출 -> 피드백 -> 다음 문제 -> 결과 화면 흐름이 동작해야 한다.
- 컴포넌트에서 직접 API를 호출하지 않아야 한다.
- 정답 판정이 이미지 URL 파싱이 아니라 `answer.label` 기준 정규화 비교로 동작해야 한다.

#### 테스트

- `fetchBreedList()` 테스트
- `fetchRandomImageByBreed()` 테스트
- `flattenBreeds()` 테스트
- `normalizeAnswer()` 테스트
- `isCorrectAnswer()` 테스트
- 문제 생성 흐름 테스트

### D. UI 컴포넌트 / 스타일 담당

#### 담당 범위

- `src/components/StartScreen.js`
- `src/components/QuizScreen.js`
- `src/components/ScoreBoard.js`
- `src/components/QuizImage.js`
- `src/components/AnswerForm.js`
- `src/components/FeedbackPanel.js`
- `src/components/ResultScreen.js`
- `styles/main.css`

#### 핵심 책임

- stateless pure function 컴포넌트 구현
- props 기반 화면 렌더링
- 입력칸, 제출 버튼, 피드백 UI 구성
- 로딩 상태, 에러 상태, 피드백 상태 표시
- 전체 스타일링

#### 완료 기준

- 목업 데이터로도 전체 화면이 동작 가능해야 한다.
- 실제 App state를 받았을 때 구조 변경 없이 연결 가능해야 한다.
- 각 컴포넌트가 local state 없이 props만으로 렌더링되어야 한다.

#### 테스트

- props 기반 렌더링 테스트
- 입력 상태 표시 테스트
- 정답/오답 피드백 표시 테스트
- 버튼 이벤트 전달 테스트

## 3. 공용 인터페이스 합의

구현 전에 반드시 아래 항목을 먼저 확정합니다.

### A와 B가 먼저 합의할 것

- runtime이 생성하는 최종 vnode shape
- `mount()`와 `update()`가 patch 계층을 호출하는 방식
- 이벤트 prop 표현 방식

### B와 C가 먼저 합의할 것

- `src/mini-react/`에서 컴포넌트가 사용할 이벤트 prop 규칙
- 입력 이벤트가 어떤 payload를 넘길지

### C와 D가 먼저 합의할 것

- `App` state shape
- `currentQuestion` shape
- 각 컴포넌트 props 명세
- 버튼 클릭 시 호출할 handler 이름

## 4. 권장 작업 순서

### 1단계

- A: `FunctionComponent`, hooks 구현
- B: WEEK4 엔진 이식, 이벤트 처리 설계
- C: `BreedEntry`, `currentQuestion`, App state shape 확정
- D: 목업 데이터 기반 UI 제작

### 2단계

- A와 B 연결
- C에서 서비스/도메인 로직 구현
- D에서 실제 props 시그니처 반영

### 3단계

- C가 `App`과 서비스/도메인 연결
- D가 실제 상태와 컴포넌트 연결
- B가 이벤트와 patch 버그 수정

### 4단계

- 통합 테스트
- 예외 케이스 점검
- README와 발표 자료 정리

## 5. 파일 소유권

충돌 방지를 위해 파일 우선 소유권을 둡니다.

- A 소유
  - `src/mini-react/component.js`
  - `src/mini-react/hooks.js`
  - `src/mini-react/renderer.js`
  - `src/mini-react/index.js`
- B 소유
  - `src/mini-react/vdom.js`
  - `src/mini-react/diff.js`
  - `src/mini-react/patch.js`
  - `src/mini-react/event.js`
- C 소유
  - `src/app.js`
  - `src/services/api.js`
  - `src/domain/quiz.js`
  - `src/domain/normalize.js`
- D 소유
  - `src/components/*`
  - `styles/main.css`

공용 수정이 필요하면 먼저 담당자와 공유 후 진행합니다.

## 6. 머지 전략

### 브랜치 이름

```text
member-a/mini-react-runtime
member-b/vdom-events
member-c/app-flow-domain
member-d/ui-components
```

### 머지 순서

1. A
2. B
3. C
4. D
5. 통합 브랜치

### 통합 브랜치 역할

- 전체 연결 확인
- 테스트 실행
- 버그 수정
- README 정리
- 발표 시나리오 정리

## 7. 각 담당자의 산출물

### A 산출물

- 동작하는 `FunctionComponent`
- hook 시스템
- runtime 테스트

### B 산출물

- 동작하는 diff/patch 연결
- 이벤트 바인딩 계층
- vdom/event 테스트

### C 산출물

- App 상태 흐름
- API 서비스
- 문제 생성 및 정답 판정 로직
- domain/service 테스트

### D 산출물

- 전체 화면 UI
- 스타일
- props 기반 컴포넌트

## 8. 통합 시 체크리스트

- `App` 상태가 루트에만 있는지
- 자식 컴포넌트가 pure function인지
- 컴포넌트에서 직접 API를 호출하지 않는지
- 이벤트가 함수형 props 기반인지
- 제출 중복 처리 방지가 있는지
- 마지막 문제 뒤 결과 화면으로 정상 이동하는지
- 다시 하기 시 초기화가 정상 동작하는지

## 9. 발표 분담 제안

발표도 구현 역할과 맞추면 자연스럽습니다.

- A
  - `FunctionComponent`, hooks, rerender 구조 설명
- B
  - VDOM, diff, patch, 이벤트 처리 설명
- C
  - App 상태 흐름, API 연동, 정답 판정 설명
- D
  - UI 구조, 사용자 흐름, 데모 시연 설명

## 10. 최종 목표

4명이 각각 다른 파일만 만드는 것이 아니라, 아래 흐름이 하나로 이어지게 만드는 것이 목표입니다.

```text
FunctionComponent + Hooks
-> vnode 생성
-> diff / patch
-> App 상태 흐름
-> API / Domain
-> UI 렌더링
```

이 기준으로 분업하면 책임이 분명하고, 통합 시 충돌도 가장 적습니다.
