import { FunctionComponent, createRoot, useEffect, useMemo, useState } from '../src/mini-react/index.js';

function createElementVNode(tag, attrs = {}, children = []) {
  return {
    type: 'element',
    tag,
    attrs,
    children,
  };
}

function createTextVNode(value) {
  return {
    type: 'text',
    value,
  };
}

describe('Mini React runtime', () => {
  it('mount() renders the initial vnode into the container', () => {
    const container = document.createElement('div');
    const component = new FunctionComponent(() => {
      return createElementVNode('p', {}, [createTextVNode('hello')]);
    }, {}, { container });

    const renderedTree = component.mount();

    expect(renderedTree.children[0].value).toBe('hello');
    expect(container.innerHTML).toBe('<p>hello</p>');
    expect(component.isMounted).toBe(true);
  });

  it('useState keeps state across rerenders and patches the DOM', () => {
    const container = document.createElement('div');
    let increment;

    function Counter() {
      const [count, setCount] = useState(0);
      increment = () => setCount((current) => current + 1);

      return createElementVNode('button', { type: 'button' }, [
        createTextVNode(`count:${count}`),
      ]);
    }

    const root = createRoot(Counter, container);
    root.mount();
    increment();
    increment();

    expect(container.innerHTML).toBe('<button type="button">count:2</button>');
    expect(root.instance.hooks[0].value).toBe(2);
  });

  it('useEffect runs cleanup before rerunning when deps change', () => {
    const container = document.createElement('div');
    const calls = [];

    function EffectComponent(props) {
      useEffect(() => {
        calls.push(`effect:${props.value}`);
        return () => {
          calls.push(`cleanup:${props.value}`);
        };
      }, [props.value]);

      return createElementVNode('p', {}, [createTextVNode(String(props.value))]);
    }

    const root = createRoot(EffectComponent, container, { value: 1 });
    root.mount();
    root.update({ value: 2 });

    expect(calls).toEqual(['effect:1', 'cleanup:1', 'effect:2']);
  });

  it('useEffect skips rerun when deps are unchanged', () => {
    const container = document.createElement('div');
    const calls = [];

    function StableEffect(props) {
      useEffect(() => {
        calls.push(`effect:${props.label}`);
      }, [props.label]);

      return createElementVNode('span', {}, [createTextVNode(props.label)]);
    }

    const root = createRoot(StableEffect, container, { label: 'alpha' });
    root.mount();
    root.update({ label: 'alpha' });

    expect(calls).toEqual(['effect:alpha']);
  });

  it('useMemo reuses cached values until deps change', () => {
    const container = document.createElement('div');
    const computed = [];

    function MemoComponent(props) {
      const value = useMemo(() => {
        computed.push(props.base);
        return props.base * 2;
      }, [props.base]);

      return createElementVNode('strong', {}, [createTextVNode(String(value))]);
    }

    const root = createRoot(MemoComponent, container, { base: 2 });
    root.mount();
    root.update({ base: 2 });
    root.update({ base: 4 });

    expect(computed).toEqual([2, 4]);
    expect(container.innerHTML).toBe('<strong>8</strong>');
  });

  it('destroy() runs effect cleanup and unmounts the current DOM', () => {
    const container = document.createElement('div');
    const calls = [];

    function EffectComponent() {
      useEffect(() => {
        calls.push('effect');
        return () => {
          calls.push('cleanup');
        };
      }, []);

      return createElementVNode('p', {}, [createTextVNode('mounted')]);
    }

    const root = createRoot(EffectComponent, container);
    root.mount();
    root.unmount();

    expect(calls).toEqual(['effect', 'cleanup']);
    expect(container.innerHTML).toBe('');
    expect(root.instance.isMounted).toBe(false);
  });

  it('throws when a component returns an invalid render value', () => {
    const container = document.createElement('div');
    const component = new FunctionComponent(() => null, {}, { container });

    expect(() => component.mount()).toThrow('함수형 컴포넌트는 vnode 객체를 반환해야 합니다.');
  });
});
