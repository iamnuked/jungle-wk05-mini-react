import { commitRoot, reconcileTrees } from '../lib/fiber.js';
import { mountVNode } from '../lib/vdom.js';
import {
  clearCurrentComponent,
  setCurrentComponent,
} from './hooks.js';

export class FunctionComponent {
  constructor(componentFn, props = {}, options = {}) {
    if (typeof componentFn !== 'function') {
      throw new Error('FunctionComponent는 함수형 컴포넌트를 받아야 합니다.');
    }

    this.componentFn = componentFn;
    this.props = props;
    this.container = options.container ?? null;
    this.hooks = [];
    this.hookIndex = 0;
    this.pendingEffects = [];
    this.currentVNode = null;
    this.isMounted = false;
    this.onRender = typeof options.onRender === 'function' ? options.onRender : null;
  }

  setProps(nextProps = {}) {
    this.props = nextProps;
  }

  mount() {
    if (!this.container) {
      throw new Error('mount()를 호출하려면 container가 필요합니다.');
    }

    const nextVNode = this.renderVNode();
    mountVNode(this.container, nextVNode);
    this.currentVNode = nextVNode;
    this.isMounted = true;
    this.flushEffects();

    if (this.onRender) {
      this.onRender(nextVNode, 'mount');
    }

    return nextVNode;
  }

  update(nextProps = this.props) {
    if (!this.container) {
      throw new Error('update()를 호출하려면 container가 필요합니다.');
    }

    this.props = nextProps;

    if (!this.isMounted) {
      return this.mount();
    }

    const nextVNode = this.renderVNode();
    const work = reconcileTrees(this.currentVNode, nextVNode);
    commitRoot(this.container, work.rootFiber);
    this.currentVNode = nextVNode;
    this.flushEffects();

    if (this.onRender) {
      this.onRender(nextVNode, 'update');
    }

    return nextVNode;
  }

  renderVNode() {
    this.pendingEffects = [];
    this.hookIndex = 0;
    setCurrentComponent(this);

    try {
      return this.componentFn(this.props);
    } finally {
      clearCurrentComponent();
    }
  }

  flushEffects() {
    const queuedEffects = this.pendingEffects.slice();
    this.pendingEffects = [];

    for (const runEffect of queuedEffects) {
      runEffect();
    }
  }
}
