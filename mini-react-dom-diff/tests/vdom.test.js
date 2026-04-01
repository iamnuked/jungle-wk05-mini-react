import {
  domNodeToVNodeTree,
  mountVNode,
  parseHtmlToVNode,
  serializeVNodeToHtml,
} from '../src/lib/vdom.js';
import {
  ChildDeletion,
  Placement,
  Update,
  commitRoot,
  reconcileTrees,
} from '../src/lib/fiber.js';

function normalizeHtml(html) {
  return html.replace(/\s+</g, '<').replace(/>\s+/g, '>').trim();
}

describe('Virtual DOM + Fiber commit engine', () => {
  it('converts DOM into a normalized virtual tree', () => {
    const tree = parseHtmlToVNode(`
      <section>
        <h1>Hello</h1>
        <p>World</p>
      </section>
    `);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].tag).toBe('section');
    expect(tree.children[0].children).toHaveLength(2);
    expect(tree.children[0].children[0].tag).toBe('h1');
    expect(tree.children[0].children[1].tag).toBe('p');
  });

  it('creates placement and update effects during reconciliation', () => {
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

    const work = reconcileTrees(previousTree, nextTree);
    const types = work.effects.map((effect) => effect.opType);
    const flags = work.effects.map((effect) => effect.flags);

    expect(types).toContain('UPDATE_PROPS');
    expect(types).toContain('UPDATE_TEXT');
    expect(types).toContain('INSERT_CHILD');
    expect(flags).toContain(Update);
    expect(flags).toContain(Placement);
  });

  it('uses placement effects for keyed child moves', () => {
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
    const moveEffect = work.effects.find((effect) => effect.opType === 'MOVE_CHILD');

    expect(moveEffect).toBeDefined();
    expect(moveEffect.flags).toBe(Placement);
  });

  it('marks parent fibers with child deletion flags when nodes are removed', () => {
    const previousTree = parseHtmlToVNode(`
      <ul>
        <li data-key="a">A</li>
        <li data-key="b">B</li>
      </ul>
    `);
    const nextTree = parseHtmlToVNode(`
      <ul>
        <li data-key="a">A</li>
      </ul>
    `);

    const work = reconcileTrees(previousTree, nextTree);

    expect(work.effects.some((effect) => effect.flags === ChildDeletion)).toBe(true);
    expect(work.rootFiber.child.flags & ChildDeletion).toBe(ChildDeletion);
  });

  it('commits fiber effects so actual DOM matches the new tree', () => {
    const container = document.createElement('div');
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

    expect(normalizeHtml(container.innerHTML)).toBe(
      normalizeHtml(serializeVNodeToHtml(nextTree)),
    );
  });

  it('reads live form control values from the browser DOM', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <label>
        <input type="text" value="alpha" />
      </label>
    `;

    const input = container.querySelector('input');
    input.value = 'beta';

    const tree = domNodeToVNodeTree(container);
    const inputNode = tree.children[0].children[0];

    expect(inputNode.attrs.value).toBe('beta');
  });

  it('preserves inline event attributes in virtual DOM and mounted DOM', () => {
    const tree = parseHtmlToVNode(`
      <button type="button" onclick="alert('hello')">Click</button>
    `);
    const buttonNode = tree.children[0];
    const container = document.createElement('div');

    mountVNode(container, tree);

    expect(buttonNode.attrs.onclick).toBe("alert('hello')");
    expect(container.querySelector('button').getAttribute('onclick')).toBe("alert('hello')");
  });
});
