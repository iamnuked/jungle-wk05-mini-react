# WEEK5 API 명세서 - Mini React Dog Breed Quiz

이 문서는 [`requirements.md`](./requirements.md)와 [`architecture.md`](./architecture.md)를 바탕으로 작성한 API 명세서입니다.  
이번 프로젝트의 API 범위는 두 가지입니다.

1. 외부 API: `Dog CEO API`
2. 내부 서비스 계층 API: `src/services/api.js`

프로젝트에서는 외부 API를 직접 화면 컴포넌트에서 호출하지 않고, 반드시 `src/services/api.js`를 통해 접근합니다.

## 1. API 설계 원칙

- 외부 API 호출은 모두 `src/services/api.js`에서 담당한다.
- `App`과 컴포넌트는 HTTP 세부사항을 몰라도 되도록 설계한다.
- 앱은 외부 API 응답 원본을 그대로 쓰지 않고, 필요한 형태로 정규화해 사용한다.
- 정답 판정은 이미지 URL 파싱에만 의존하지 않는다.
- 문제 생성은 `정답 후보 선택 -> 이미지 요청` 순서로 진행한다.
- 실패 시 예외를 숨기지 않고, 서비스 계층에서 일관된 에러 객체 또는 예외로 전달한다.

## 2. 외부 API 개요

기본 URL:

```text
https://dog.ceo/api
```

이번 프로젝트에서 사용하는 외부 엔드포인트는 아래 2종류입니다.

- 전체 견종 목록 조회
- 특정 견종 이미지 조회

## 3. 외부 API 상세 명세

### 3.1 전체 견종 목록 조회

#### Request

```http
GET /breeds/list/all
Host: dog.ceo
```

전체 URL:

```text
https://dog.ceo/api/breeds/list/all
```

#### Success Response

```json
{
  "message": {
    "affenpinscher": [],
    "bulldog": ["boston", "english", "french"],
    "mastiff": ["bull", "english", "tibetan"],
    "pug": []
  },
  "status": "success"
}
```

#### 의미

- 최상위 key는 `breed`
- 배열 값은 `subBreed` 목록
- 빈 배열이면 서브브리드가 없는 견종

#### 앱 내부 변환 결과

서비스 계층에서는 위 응답을 그대로 쓰지 않고 아래 형태 배열로 평탄화합니다.

```js
[
  {
    key: 'affenpinscher',
    breed: 'affenpinscher',
    subBreed: null,
    label: 'Affenpinscher',
  },
  {
    key: 'bulldog-french',
    breed: 'bulldog',
    subBreed: 'french',
    label: 'French Bulldog',
  }
]
```

### 3.2 특정 견종 랜덤 이미지 조회

정답 후보가 일반 breed인지, sub-breed인지에 따라 URL 형식이 다릅니다.

#### 3.2.1 breed만 있는 경우

Request:

```http
GET /breed/{breed}/images/random
Host: dog.ceo
```

예시:

```text
https://dog.ceo/api/breed/pug/images/random
```

Success Response:

```json
{
  "message": "https://images.dog.ceo/breeds/pug/n02110958_1234.jpg",
  "status": "success"
}
```

#### 3.2.2 sub-breed가 있는 경우

Request:

```http
GET /breed/{breed}/{subBreed}/images/random
Host: dog.ceo
```

예시:

```text
https://dog.ceo/api/breed/bulldog/french/images/random
```

Success Response:

```json
{
  "message": "https://images.dog.ceo/breeds/bulldog-french/n02108915_4321.jpg",
  "status": "success"
}
```

#### 의미

- `message`는 이미지 URL 문자열
- `status`는 요청 성공 여부
- 앱은 `message`를 `imageUrl`로 사용한다

## 4. 외부 API 실패 처리 기준

Dog CEO API는 실패 시 아래와 같은 형태를 반환할 수 있습니다.

```json
{
  "status": "error",
  "message": "Breed not found"
}
```

앱에서는 아래 상황을 실패로 간주합니다.

- HTTP status가 200이 아닌 경우
- JSON 파싱 실패
- `status !== 'success'`
- `message` 필드가 기대한 타입이 아닌 경우
- 네트워크 오류 발생

## 5. 내부 서비스 계층 API 명세

서비스 계층 파일 위치:

```text
src/services/api.js
```

이 파일은 외부 HTTP 요청을 앱 내부에서 사용할 수 있는 형태로 변환합니다.

## 6. 내부 타입 정의

### 6.1 BreedEntry

```js
{
  key: string,
  breed: string,
  subBreed: string | null,
  label: string,
}
```

예시:

```js
{
  key: 'pug',
  breed: 'pug',
  subBreed: null,
  label: 'Pug',
}
```

```js
{
  key: 'bulldog-french',
  breed: 'bulldog',
  subBreed: 'french',
  label: 'French Bulldog',
}
```

### 6.2 QuestionImage

```js
{
  imageUrl: string,
}
```

### 6.3 ApiError

```js
{
  code: string,
  message: string,
  cause?: unknown,
}
```

권장 `code` 값:

- `NETWORK_ERROR`
- `HTTP_ERROR`
- `INVALID_RESPONSE`
- `DOG_API_ERROR`

## 7. 내부 함수 명세

### 7.1 `fetchBreedList()`

#### 목적

- 전체 견종 목록을 조회하고, 앱에서 사용할 `BreedEntry[]` 형태로 반환한다.

#### 시그니처

```js
async function fetchBreedList(): Promise<BreedEntry[]>
```

#### 입력

- 없음

#### 처리 흐름

1. `GET /breeds/list/all` 요청
2. 응답 검증
3. `message` 객체를 평탄화
4. `BreedEntry[]` 반환

#### 반환 예시

```js
[
  {
    key: 'affenpinscher',
    breed: 'affenpinscher',
    subBreed: null,
    label: 'Affenpinscher',
  },
  {
    key: 'bulldog-french',
    breed: 'bulldog',
    subBreed: 'french',
    label: 'French Bulldog',
  },
]
```

#### 실패

- 실패 시 `ApiError`를 throw한다.

### 7.2 `fetchRandomImageByBreed(entry)`

#### 목적

- 전달받은 `BreedEntry` 기준으로 랜덤 이미지 1장을 조회한다.

#### 시그니처

```js
async function fetchRandomImageByBreed(entry): Promise<{ imageUrl: string }>
```

#### 입력

```js
{
  key: string,
  breed: string,
  subBreed: string | null,
  label: string,
}
```

#### URL 규칙

- `subBreed === null`
  - `/breed/{breed}/images/random`
- `subBreed !== null`
  - `/breed/{breed}/{subBreed}/images/random`

#### 반환 예시

```js
{
  imageUrl: 'https://images.dog.ceo/breeds/pug/n02110958_1234.jpg',
}
```

#### 실패

- 실패 시 `ApiError`를 throw한다.

## 8. 서비스 계층 구현 규칙

- 컴포넌트에서 `fetch()`를 직접 호출하지 않는다.
- 모든 외부 API 호출은 `src/services/api.js`를 통해서만 수행한다.
- `fetchBreedList()`는 평탄화된 결과만 반환해야 한다.
- `fetchRandomImageByBreed()`는 URL 문자열이 아니라 `{ imageUrl }` 객체 또는 명확한 구조를 반환해야 한다.
- 서비스 계층은 정답 판정을 하지 않는다.
- 서비스 계층은 문제 생성에 필요한 네트워크 데이터만 제공한다.
- 문제 객체 조합과 문제 생성 흐름은 `src/domain/quiz.js`에서 담당한다.

## 9. App과 서비스 계층 연동 방식

### 초기 앱 진입

1. `App.mount()`
2. `useEffect([])`
3. `fetchBreedList()`
4. 성공 시 `breedList` 저장
5. 실패 시 `error` 저장

### 새 문제 생성

1. `domain/quiz.js`에서 정답 후보 선택
2. `services/api.js`에서 해당 견종 이미지 요청
3. `domain/quiz.js`에서 `{ answer, imageUrl }` 조합으로 `currentQuestion` 생성
4. App state 반영

## 10. 내부 상태와 API 데이터 연결 규칙

### App state 예시

```js
{
  breedList: BreedEntry[],
  currentQuestion: {
    id: 'q-1',
    answer: BreedEntry,
    imageUrl: string,
  } | null,
  userAnswer: '',
  feedback: null,
  isLoading: false,
  error: null,
}
```

### 규칙

- `breedList`는 `fetchBreedList()` 결과만 저장한다.
- `currentQuestion.answer`는 반드시 `BreedEntry`여야 한다.
- `currentQuestion.imageUrl`은 서비스 계층 반환값을 그대로 사용한다.
- 정답 판정은 `currentQuestion.answer.label`과 사용자 입력을 정규화해서 비교한다.

## 11. 에러 메시지 처리 정책

서비스 계층에서 발생한 에러는 화면에 바로 노출하지 않고, 앱에서 사용자 친화적인 문구로 변환합니다.

예시:

- `NETWORK_ERROR`
  - "네트워크 오류가 발생했습니다. 다시 시도해주세요."
- `DOG_API_ERROR`
  - "강아지 정보를 불러오지 못했습니다."
- `INVALID_RESPONSE`
  - "응답 형식이 올바르지 않습니다."

## 12. 테스트 대상 API 계약

테스트에서는 아래 계약을 검증해야 합니다.

- `fetchBreedList()`가 외부 응답을 `BreedEntry[]`로 변환하는지
- sub-breed가 있는 경우 `label`, `key`가 올바르게 생성되는지
- `fetchRandomImageByBreed()`가 breed 여부에 따라 올바른 URL을 호출하는지
- 외부 API 실패 시 `ApiError`를 throw하는지
- 잘못된 응답 형식에서 `INVALID_RESPONSE`를 반환하는지

## 13. 예시 코드 스케치

```js
export async function fetchBreedList() {
  const response = await fetch('https://dog.ceo/api/breeds/list/all');

  if (!response.ok) {
    throw { code: 'HTTP_ERROR', message: 'Failed to fetch breed list' };
  }

  const data = await response.json();

  if (data.status !== 'success' || typeof data.message !== 'object') {
    throw { code: 'INVALID_RESPONSE', message: 'Invalid breed list response' };
  }

  return flattenBreeds(data.message);
}
```

```js
export async function fetchRandomImageByBreed(entry) {
  const path = entry.subBreed
    ? `https://dog.ceo/api/breed/${entry.breed}/${entry.subBreed}/images/random`
    : `https://dog.ceo/api/breed/${entry.breed}/images/random`;

  const response = await fetch(path);

  if (!response.ok) {
    throw { code: 'HTTP_ERROR', message: 'Failed to fetch breed image' };
  }

  const data = await response.json();

  if (data.status !== 'success' || typeof data.message !== 'string') {
    throw { code: 'INVALID_RESPONSE', message: 'Invalid image response' };
  }

  return { imageUrl: data.message };
}
```

## 14. 최종 요약

- 외부 API는 Dog CEO API를 사용한다.
- 전체 견종 목록 조회와 견종별 이미지 조회 두 가지 요청만 사용한다.
- 앱은 외부 응답을 그대로 쓰지 않고 `BreedEntry` 중심 구조로 변환한다.
- `src/services/api.js`는 HTTP 통신과 응답 검증만 담당한다.
- 문제 생성과 정답 판정은 `src/domain/`에서 담당한다.
- 화면 컴포넌트는 서비스 계층 함수만 호출하고, 외부 API 세부사항은 알지 않도록 설계한다.
