// fiber가 어떤 commit 작업을 필요로 하는지 나타내는 비트 플래그와 디버깅용 라벨을 정의한다.
export const NoFlags = 0;
export const Placement = 1 << 0;
export const Update = 1 << 1;
export const ChildDeletion = 1 << 2;

const FLAG_LABELS = {
  [Placement]: 'Placement',
  [Update]: 'Update',
  [ChildDeletion]: 'ChildDeletion',
};

/**
 * 비트마스크 값을 사람이 읽기 쉬운 fiber 플래그 이름 목록으로 변환한다.
 *
 * @param {number} flags - export된 fiber 플래그 상수들로 조합된 비트마스크 값.
 * @returns {string[]} 전달된 비트마스크에 해당하는 플래그 라벨 목록.
 */
export function getFlagNames(flags) {
  if (flags === NoFlags) {
    return ['NoFlags'];
  }

  return Object.entries(FLAG_LABELS)
    .filter(([bit]) => (flags & Number(bit)) !== 0)
    .map(([, label]) => label);
}
