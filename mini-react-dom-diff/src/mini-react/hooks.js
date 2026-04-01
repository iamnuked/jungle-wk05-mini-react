let currentComponent = null;

function areHookDepsEqual(previousDeps, nextDeps) {
  if (!Array.isArray(previousDeps) || !Array.isArray(nextDeps)) {
    return false;
  }

  if (previousDeps.length !== nextDeps.length) {
    return false;
  }

  for (let index = 0; index < previousDeps.length; index += 1) {
    if (!Object.is(previousDeps[index], nextDeps[index])) {
      return false;
    }
  }

  return true;
}

export function setCurrentComponent(component) {
  currentComponent = component;
}

export function clearCurrentComponent() {
  currentComponent = null;
}

export function getCurrentComponent() {
  return currentComponent;
}

function requireCurrentComponent(hookName) {
  if (!currentComponent) {
    throw new Error(`${hookName}는 FunctionComponent 렌더링 중에만 호출할 수 있습니다.`);
  }

  return currentComponent;
}

export function useState(initialValue) {
  const component = requireCurrentComponent('useState');
  const hookPosition = component.hookIndex;
  const existingHook = component.hooks[hookPosition];

  if (!existingHook) {
    component.hooks[hookPosition] = {
      kind: 'state',
      value: typeof initialValue === 'function' ? initialValue() : initialValue,
    };
  }

  const hook = component.hooks[hookPosition];

  const setState = (nextValue) => {
    const resolvedValue = typeof nextValue === 'function'
      ? nextValue(hook.value)
      : nextValue;

    if (Object.is(hook.value, resolvedValue)) {
      return hook.value;
    }

    hook.value = resolvedValue;
    component.update();
    return hook.value;
  };

  component.hookIndex += 1;

  return [hook.value, setState];
}

export function useEffect(effect, deps) {
  const component = requireCurrentComponent('useEffect');
  const hookPosition = component.hookIndex;
  const existingHook = component.hooks[hookPosition];
  const normalizedDeps = Array.isArray(deps) ? deps : null;
  const shouldRun = !existingHook || normalizedDeps === null || !areHookDepsEqual(existingHook.deps, normalizedDeps);

  if (!existingHook) {
    component.hooks[hookPosition] = {
      kind: 'effect',
      deps: normalizedDeps,
      cleanup: null,
    };
  } else {
    existingHook.deps = normalizedDeps;
  }

  const hook = component.hooks[hookPosition];

  if (shouldRun) {
    component.pendingEffects.push(() => {
      if (typeof hook.cleanup === 'function') {
        hook.cleanup();
      }

      const cleanup = effect();
      hook.cleanup = typeof cleanup === 'function' ? cleanup : null;
    });
  }

  component.hookIndex += 1;
}

export function useMemo(factory, deps) {
  const component = requireCurrentComponent('useMemo');
  const hookPosition = component.hookIndex;
  const existingHook = component.hooks[hookPosition];
  const normalizedDeps = Array.isArray(deps) ? deps : null;

  if (
    existingHook
    && normalizedDeps !== null
    && areHookDepsEqual(existingHook.deps, normalizedDeps)
  ) {
    component.hookIndex += 1;
    return existingHook.value;
  }

  const value = factory();
  component.hooks[hookPosition] = {
    kind: 'memo',
    deps: normalizedDeps,
    value,
  };
  component.hookIndex += 1;

  return value;
}
