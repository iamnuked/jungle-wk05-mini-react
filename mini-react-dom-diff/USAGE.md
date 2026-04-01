# Virtual DOM Diff Lab Usage Guide

이 문서는 `virtual-dom-diff-lab` 라이브러리를 다른 프로젝트에서 사용하는 방법을 설명합니다.

## 1. 전제 조건

- 브라우저 DOM API가 있는 환경이어야 합니다.
- 서버 환경에서는 JSDOM 같은 DOM 구현이 필요합니다.
- 패키지는 ESM 기준으로 배포됩니다.

## 2. 설치

```bash
npm install virtual-dom-diff-lab
```

## 3. import 방법

전체 API를 루트 엔트리에서 가져올 수 있습니다.

```js
import {
  parseHtmlToVNode,
  domNodeToVNodeTree,
  mountVNode,
  reconcileTrees,
  commitRoot,
  serializeVNodeToHtml,
} from 'virtual-dom-diff-lab';
```

VDOM 유틸리티만 필요하면:

```js
import { parseHtmlToVNode, mountVNode } from 'virtual-dom-diff-lab/vdom';
```

Fiber API만 필요하면:

```js
import { reconcileTrees, commitRoot, Placement } from 'virtual-dom-diff-lab/fiber';
```

## 4. 핵심 개념

이 라이브러리는 아래 3단계 흐름으로 사용합니다.

1. HTML 또는 실제 DOM을 Virtual DOM으로 변환합니다.
2. 이전 트리와 다음 트리를 비교해 effect 큐를 만듭니다.
3. commit 단계에서 실제 DOM을 갱신합니다.

즉, 보통 `parse -> reconcile -> commit` 순서로 사용합니다.

## 5. 가장 기본적인 사용 예제

```js
import {
  parseHtmlToVNode,
  mountVNode,
  reconcileTrees,
  commitRoot,
} from 'virtual-dom-diff-lab';

const container = document.querySelector('#app');

const previousTree = parseHtmlToVNode(`
  <div class="before">
    <p>old text</p>
  </div>
`);

const nextTree = parseHtmlToVNode(`
  <div class="after" data-state="ready">
    <p>new text</p>
    <span>added</span>
  </div>
`);

mountVNode(container, previousTree);

const work = reconcileTrees(previousTree, nextTree);
commitRoot(container, work.rootFiber);
```

위 코드에서:

- `mountVNode`는 초기 DOM을 렌더링합니다.
- `reconcileTrees`는 이전/다음 VDOM을 비교합니다.
- `commitRoot`는 비교 결과를 실제 DOM에 반영합니다.

## 6. 실제 DOM에서 현재 상태 읽기

이미 화면에 렌더링된 DOM을 기준으로 현재 상태를 읽고 싶다면 `domNodeToVNodeTree`를 사용합니다.

```js
import { domNodeToVNodeTree, reconcileTrees, commitRoot } from 'virtual-dom-diff-lab';

const container = document.querySelector('#preview');

const previousTree = domNodeToVNodeTree(container);
const nextTree = {
  type: 'root',
  children: [
    {
      type: 'element',
      tag: 'p',
      attrs: { class: 'done' },
      children: [{ type: 'text', value: 'updated' }],
    },
  ],
};

const work = reconcileTrees(previousTree, nextTree);
commitRoot(container, work.rootFiber);
```

이 방식은 textarea, input 같은 form control의 현재 값까지 읽어야 할 때 유용합니다.

## 7. effect 큐 검사하기

`reconcileTrees`의 반환값에는 `effects` 배열이 포함됩니다.

```js
const work = reconcileTrees(previousTree, nextTree);

console.log(work.effects);
```

effect 예시는 아래와 같습니다.

```js
{
  opType: 'UPDATE_TEXT',
  path: [0, 0],
  value: 'new text'
}
```

주요 `opType`:

- `INSERT_CHILD`
- `MOVE_CHILD`
- `REMOVE_CHILD`
- `UPDATE_PROPS`
- `UPDATE_TEXT`

이 정보는 디버깅, 시각화, 성능 분석용으로 사용할 수 있습니다.

## 8. keyed reorder 처리

형제 노드에 `data-key` 또는 `id`가 모두 있으면 keyed diff가 활성화됩니다.

```js
const previousTree = parseHtmlToVNode(`
  <ul>
    <li data-key="a">A</li>
    <li data-key="b">B</li>
    <li data-key="c">C</li>
  </ul>
`);

const nextTree = parseHtmlToVNode(`
  <ul>
    <li data-key="c">C</li>
    <li data-key="a">A</li>
    <li data-key="b">B</li>
  </ul>
`);

const work = reconcileTrees(previousTree, nextTree);
```

이 경우 단순 삭제/재삽입 대신 `MOVE_CHILD` effect가 생성될 수 있습니다.

## 9. HTML 문자열로 다시 직렬화하기

VDOM 상태를 문자열로 저장하거나 비교하고 싶으면 `serializeVNodeToHtml`을 사용합니다.

```js
import { parseHtmlToVNode, serializeVNodeToHtml } from 'virtual-dom-diff-lab';

const tree = parseHtmlToVNode('<section><h1>Hello</h1></section>');
const html = serializeVNodeToHtml(tree);

console.log(html);
```

## 10. 공개 API 요약

### Root Entry

`virtual-dom-diff-lab`

- `initApp`
- VDOM 관련 모든 export
- Fiber 관련 모든 export

### VDOM Entry

`virtual-dom-diff-lab/vdom`

- `createRootVNode`
- `cloneVNode`
- `parseHtmlToVNode`
- `domNodeToVNode`
- `domNodeToVNodeTree`
- `getVNodeKey`
- `renderVNode`
- `mountVNode`
- `setDomAttribute`
- `removeDomAttribute`
- `serializeVNodeToHtml`
- `countVNodeStats`

### Fiber Entry

`virtual-dom-diff-lab/fiber`

- `reconcileTrees`
- `commitRoot`
- `summarizeCommitOperations`
- `formatFiberPath`
- `NoFlags`
- `Placement`
- `Update`
- `ChildDeletion`
- `getFlagNames`

## 11. 제한 사항

- TypeScript 타입 선언은 아직 없습니다.
- `<script>`, `<style>`, `<iframe>` 같은 일부 태그는 VDOM 변환에서 제외됩니다.
- keyed diff는 형제 노드가 모두 key를 가질 때만 동작합니다.
- commit은 실제 DOM을 직접 변경하므로 브라우저 상태와의 동기화를 호출자가 관리해야 합니다.

## 12. 권장 사용 패턴

- 초기 렌더: `parseHtmlToVNode` + `mountVNode`
- 업데이트 반영: `reconcileTrees` + `commitRoot`
- 현재 DOM 읽기: `domNodeToVNodeTree`
- 디버깅: `work.effects`, `summarizeCommitOperations`, `getFlagNames`

## 13. 데모 앱이 필요할 때

라이브러리 API가 아니라 시각화 playground 자체가 필요하면 루트 export의 `initApp(container)`를 사용할 수 있습니다.

```js
import { initApp } from 'virtual-dom-diff-lab';

initApp(document.getElementById('app'));
```

이 API는 교육/데모 목적이고, 일반적인 라이브러리 소비에서는 VDOM/Fiber API를 직접 사용하는 쪽이 더 적절합니다.
