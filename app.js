/**
 * 할 일 목록 (To-Do List)
 * 담백하고 직관적인 실사용 로직
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const emptyState = document.getElementById('emptyState');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const filterButtons = document.querySelectorAll('.tab-btn');
  const currentDateEl = document.getElementById('currentDate');
  const toastEl = document.getElementById('toast');
  const toastTextEl = document.getElementById('toastText');

  // Stats Elements
  const progressPercentEl = document.getElementById('progressPercent');
  const progressBarFillEl = document.getElementById('progressBarFill');
  const pendingCountEl = document.getElementById('pendingCount');
  const completedCountEl = document.getElementById('completedCount');
  const countAllEl = document.getElementById('countAll');
  const countPendingEl = document.getElementById('countPending');
  const countCompletedEl = document.getElementById('countCompleted');
  const bottomRemainingCountEl = document.getElementById('bottomRemainingCount');

  // State
  const STORAGE_KEY = 'todo_items_clean_v1';
  let currentFilter = 'all';
  let toastTimer = null;

  // 기본 데이터
  const defaultTodos = [
    { id: 1, text: '프로젝트 기획서 검토', completed: false, createdAt: Date.now() - 3600000 },
    { id: 2, text: '오후 팀 회의 준비', completed: false, createdAt: Date.now() - 1800000 },
    { id: 3, text: '이메일 답장 보내기', completed: true, createdAt: Date.now() }
  ];

  let todos = loadTodos();

  // 초기화
  initDate();
  sortTodos();
  render();
  todoInput.focus();

  // 이벤트 리스너
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });

  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.isComposing) return;
      e.preventDefault();
      handleSubmit();
    }
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  clearCompletedBtn.addEventListener('click', () => {
    const hasCompleted = todos.some((t) => t.completed);
    if (!hasCompleted) return;

    todos = todos.filter((t) => !t.completed);
    saveTodos();
    render();
    todoInput.focus();
  });

  // 주요 함수들
  function handleSubmit() {
    const text = todoInput.value.trim();

    // 1. 비어있으면 추가 방지
    if (!text) {
      shakeInput();
      todoInput.value = '';
      todoInput.focus();
      return;
    }

    // 5. 중복 할 일 추가 시 안내
    const isDuplicate = todos.some(
      (todo) => todo.text.trim().toLowerCase() === text.toLowerCase()
    );

    if (isDuplicate) {
      showToast('이미 있는 할일이에요');
      shakeInput();
      todoInput.select();
      return;
    }

    addTodo(text);
    // 3. 입력창 자동 비우기 및 포커스 유지
    todoInput.value = '';
    todoInput.focus();
  }

  function shakeInput() {
    todoInput.classList.remove('shake');
    void todoInput.offsetWidth;
    todoInput.classList.add('shake');
    setTimeout(() => {
      todoInput.classList.remove('shake');
    }, 350);
  }

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastTextEl.textContent = message;
    toastEl.classList.add('show');

    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2000);
  }

  function initDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    currentDateEl.textContent = now.toLocaleDateString('ko-KR', options);
  }

  function loadTodos() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultTodos;
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error(e);
    }
  }

  // 완료 항목은 목록 아래쪽으로 정렬
  function sortTodos() {
    todos.sort((a, b) => {
      if (a.completed === b.completed) {
        return b.createdAt - a.createdAt;
      }
      return a.completed ? 1 : -1;
    });
  }

  function addTodo(text) {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: Date.now()
    };
    todos.unshift(newTodo);
    sortTodos();
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    sortTodos();
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
    todoInput.focus();
  }

  function updateStats() {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressPercentEl.textContent = `${percentage}%`;
    progressBarFillEl.style.width = `${percentage}%`;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;

    countAllEl.textContent = total;
    countPendingEl.textContent = pending;
    countCompletedEl.textContent = completed;

    if (bottomRemainingCountEl) {
      bottomRemainingCountEl.textContent = pending;
    }

    clearCompletedBtn.style.opacity = completed > 0 ? '1' : '0.4';
    clearCompletedBtn.style.pointerEvents = completed > 0 ? 'auto' : 'none';
  }

  function getFilteredTodos() {
    if (currentFilter === 'pending') {
      return todos.filter((t) => !t.completed);
    } else if (currentFilter === 'completed') {
      return todos.filter((t) => t.completed);
    }
    return todos;
  }

  function render() {
    updateStats();

    const filteredTodos = getFilteredTodos();
    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');

      filteredTodos.forEach((todo) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        // 체크박스
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'custom-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        checkboxLabel.appendChild(checkbox);

        // 할 일 텍스트
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-content';
        textSpan.textContent = todo.text;
        textSpan.addEventListener('click', () => toggleTodo(todo.id));

        // 삭제 버튼 (평소 흐리게, 호버 시 진해짐)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', '삭제');
        deleteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        `;
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTodo(todo.id);
        });

        li.appendChild(checkboxLabel);
        li.appendChild(textSpan);
        li.appendChild(deleteBtn);

        todoList.appendChild(li);
      });
    }
  }
});
