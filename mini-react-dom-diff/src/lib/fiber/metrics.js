// reconcile 또는 commit 이후의 raw effect 데이터를 검사 패널 UI에 맞는 집계값과 경로 문자열로 바꾼다.
/**
 * 대시보드 통계를 위해 effect 객체를 commit 연산 종류별로 집계한다.
 *
 * @param {Array<{opType: string}>} effects - reconciliation 단계에서 생성된 fiber effect 큐.
 * @returns {{insert: number, move: number, remove: number, attribute: number, text: number}} 연산 종류별 개수.
 */
export function summarizeCommitOperations(effects) {
  return effects.reduce(
    (summary, effect) => {
      switch (effect.opType) {
        case 'INSERT_CHILD':
          summary.insert += 1;
          break;
        case 'MOVE_CHILD':
          summary.move += 1;
          break;
        case 'REMOVE_CHILD':
          summary.remove += 1;
          break;
        case 'UPDATE_PROPS':
          summary.attribute += 1;
          break;
        case 'UPDATE_TEXT':
          summary.text += 1;
          break;
      }

      return summary;
    },
    {
      insert: 0,
      move: 0,
      remove: 0,
      attribute: 0,
      text: 0,
    },
  );
}

/**
 * fiber path 배열을 읽기 쉬운 breadcrumb 문자열로 변환한다.
 *
 * @param {number[]} path - 루트 컨테이너부터 현재 fiber까지의 자식 인덱스 경로.
 * @returns {string} `root > 0 > 2` 형태의 사용자용 경로 문자열.
 */
export function formatFiberPath(path) {
  if (!path.length) {
    return 'root';
  }

  return `root > ${path.join(' > ')}`;
}
