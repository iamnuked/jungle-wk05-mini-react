import { FunctionComponent } from './component.js';

export function createRoot(componentFn, container, initialProps = {}) {
  const instance = new FunctionComponent(componentFn, initialProps, { container });

  return {
    instance,
    mount() {
      return instance.mount();
    },
    update(nextProps = instance.props) {
      return instance.update(nextProps);
    },
    unmount() {
      return instance.destroy();
    },
  };
}

export function render(componentFn, container, initialProps = {}) {
  const root = createRoot(componentFn, container, initialProps);
  root.mount();
  return root;
}
