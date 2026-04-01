import { mountApp } from '../app.js';
import './styles.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('데모를 마운트할 #root 컨테이너를 찾지 못했습니다.');
}

mountApp(container);
