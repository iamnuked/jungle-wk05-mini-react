let currentComponent = null;
let hookIndex = 0;

function useState(initialValue) {
  const hooks = currentComponent.hooks;
  const index = hookIndex;

  // 처음 렌더일 때만 초기값 저장
  if (hooks[index] === undefined) {
    hooks[index] = initialValue;
  }

  function setState(newValue) {
    hooks[index] = newValue;
    currentComponent.update();
  }

  hookIndex++;

  return [hooks[index], setState];
}

class FunctionComponent {
  constructor(renderFn) {
    this.renderFn = renderFn; // 실행할 함수 컴포넌트
    this.hooks = []; // 이 컴포넌트의 state 저장소
  }

  mount() {
    currentComponent = this;
    hookIndex = 0;

    const result = this.renderFn();
    console.log("mount:", result);
    return result;
  }

  update() {
    currentComponent = this;
    hookIndex = 0;

    const result = this.renderFn();
    console.log("update:", result);
    return result;
  }
}

function MyComponent() {
  const [count, setCount] = useState(0);

  console.log("현재 count:", count);

  return {
    increase() {
      setCount(count + 1);
    },
    view: `<p>count: ${count}</p>`
  };
}

// 실행
const myComponent = new FunctionComponent(MyComponent);

// 처음 렌더
const firstRender = myComponent.mount();
console.log(firstRender.view); // <p>count: 0</p>

// 상태 변경
firstRender.increase(); // update 발생