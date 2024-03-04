'use strict';

const body = document.querySelector('body');

const generatePage = () => {
  body.innerHTML = `
  <h1>TODO List</h1>
  <p class="comment">TIPS:</p>
  <p class="comment">to edit task double click to it's title</p>
  <p class="comment">to finish task edition click 'Enter' key</p>
  <p class="comment">task title saves only after finishing edition</p>
  <input type="text" class="input" placeholder="Write new task here...">
  <button class="btn-add">Add</button> <br>
  <button class="btn-clear hidden">Clear completed</button>
  <ul class="list"></ul>
  <div class="filter hidden">
    <button class="btn-filter" data-filter="all">all</button>
    <button class="btn-filter" data-filter="active">active</button>
    <button class="btn-filter" data-filter="completed">completed</button>
  </div>

  `;
};
generatePage();

const addTaskButton = document.querySelector('.btn-add');
const clearCompletedTaskButton = document.querySelector('.btn-clear');
const inputTaskTitle = document.querySelector('.input');
const taskListElement = document.querySelector('.list');
const inputs = document.querySelectorAll('.task-input');
const filterButtons = document.querySelector('.filter');
const defaultFilterOption = document.querySelector('.btn-filter[data-filter="all"]');
let previousActiveFilter = defaultFilterOption;

const renderTasks = () => {
  taskListElement.innerHTML = '';
  const tasksData = getFromLocalStorage('tasks');
  if (tasksData.length > 0) {
    turnFilters(true);
    clearFilters();
    tasksData.forEach((task) => renderNewTask(task));
  }
};

const renderFilteredTasks = (filterOption) => {
  const tasksData = getFromLocalStorage('tasks');
  if (tasksData.length < 1) {
    return;
  }

  taskListElement.innerHTML = '';
  if (filterOption === 'all') {
    tasksData.forEach((task) => renderNewTask(task));
  } else if (filterOption === 'active') {
    tasksData.forEach((task) => {
      if (!task.completed) {
        renderNewTask(task);
      }
    });
  } else if (filterOption === 'completed') {
    tasksData.forEach((task) => {
      if (task.completed) {
        renderNewTask(task);
      }
    });
  }
};

const turnFilters = (enable) => {
  if (enable) {
    filterButtons.classList.remove('hidden');
    clearCompletedTaskButton.classList.remove('hidden');
  } else {
    filterButtons.classList.add('hidden');
    clearCompletedTaskButton.classList.add('hidden');
  }
};

const renderNewTask = (task) => {
  const taskTitleElement = document.createElement('label');
  taskTitleElement.textContent = task.title;
  taskTitleElement.classList.add('input-task');
  taskTitleElement.classList.add(task.completed ? 'completed' : 'new');
  taskTitleElement.dataset.title = task.title;

  const taskElement = document.createElement('li');
  taskElement.classList.add('list-item');
  taskElement.dataset.id = task.id;
  taskElement.innerHTML += `
  <button class="btn-complete" data-action="complete">Complete</button>
  <button class="btn-delete" data-action="delete">Delete</button>
  `;

  taskElement.appendChild(taskTitleElement);
  taskListElement.appendChild(taskElement);
};

const appendToLocalStorage = (key, newData) => {
  const data = getFromLocalStorage(key);
  data.push(newData);
  localStorage.setItem(key, JSON.stringify(data));
};

const removeFromLocalStorage = (key, id) => {
  const data = getFromLocalStorage(key);
  localStorage.setItem(
    key,
    JSON.stringify(data.filter((item) => item.id !== id))
  );
};

const updateLocalStorage = (key, id, newTask) => {
  const tasks = getFromLocalStorage(key);
  for (const task in tasks) {
    if (tasks[task].id === id) {
      tasks[task] = { ...tasks[task], ...newTask };
      break;
    }
  }
  localStorage.setItem(key, JSON.stringify(tasks));
};

const getFromLocalStorage = (key) => {
  const tasksData = localStorage.getItem(key);
  return tasksData ? JSON.parse(tasksData) : [];
};

const clearFilters = () => {
  if (previousActiveFilter) {
    previousActiveFilter.classList.remove('active');
    defaultFilterOption.classList.add('active');
    previousActiveFilter = defaultFilterOption;
  }
}

const saveOnBlur = (taskId, event) => {
  const target = event.target;
  const task = target.closest('.list-item');
  console.log(task);
  if (target.value.trim() === '' || !target.value) {
    removeFromLocalStorage('tasks', taskId);
    task.remove();
  }
  const labelOutput = document.createElement('label');
  labelOutput.textContent = target.value;
  labelOutput.classList = target.classList;
  labelOutput.dataset.title = target.dataset.title;
  target.replaceWith(labelOutput);

  updateLocalStorage('tasks', taskId, { title: target.value });
}

addTaskButton.addEventListener('click', () => {
  const title = inputTaskTitle.value;
  if (!title || title.trim() === '') {
    return;
  }
  clearFilters();
  const newTask = {
    id: new Date().getTime(),
    title: title,
    completed: false,
  };
  appendToLocalStorage('tasks', newTask);
  renderTasks();

  inputTaskTitle.value = '';
  if (getFromLocalStorage('tasks').length > 0) {
    turnFilters(true);
  }
});

clearCompletedTaskButton.addEventListener('click', () => {
  const tasks = getFromLocalStorage('tasks');
  tasks.forEach((task) => {
    if (task.completed) {
      removeFromLocalStorage('tasks', task.id);
    }
  });
  renderTasks();
});

taskListElement.addEventListener('click', (event) => {
  const target = event.target;

  const taskElement = target.closest('.list-item');
  if (!taskElement) {
    return;
  }
  const taskId = +taskElement.dataset.id;

  if (target.dataset.action === 'complete') {
    const task = getFromLocalStorage('tasks').find(
      (task) => task.id === taskId
    );
    updateLocalStorage('tasks', taskId, { completed: !task.completed });
    const taskInput = taskElement.querySelector('.input-task');
    taskInput.classList.toggle('completed');
  } else if (target.dataset.action === 'delete') {
    removeFromLocalStorage('tasks', taskId);
    taskElement.remove();
    turnFilters(getFromLocalStorage('tasks').length > 0);
  }
});

taskListElement.addEventListener('dblclick', (event) => {
  const target = event.target;
  if (!target.dataset.title) {
    return;
  }
  if (target.tagName === 'INPUT') {
    return;
  }
  const taskId = +target.closest('.list-item').dataset.id;
  const editInput = document.createElement('input');

  editInput.value = target.textContent;
  editInput.dataset.title = target.dataset.title;
  editInput.classList = target.classList;

  target.replaceWith(editInput);
  editInput.focus();

  editInput.addEventListener('blur', saveOnBlur.bind(null, taskId), { once: true });
});

taskListElement.addEventListener('keydown', (event) => {
  const target = event.target;
  if (!target.dataset.title) return;

  const taskId = +target.closest('.list-item').dataset.id;

  if (event.key === 'Enter') {
    if (target.value.trim() === '' || !target.value) {
      removeFromLocalStorage('tasks', taskId);
      target.closest('.list-item').remove();
    }
    updateLocalStorage('tasks', taskId, { title: target.value });

    const labelOutput = document.createElement('label');

    labelOutput.textContent = target.value;
    labelOutput.classList = target.classList;
    labelOutput.dataset.title = target.dataset.title;

    target.replaceWith(labelOutput);
  }
});

filterButtons.addEventListener('click', (event) => {
  const target = event.target;
  if (!target.dataset.filter) {
    return;
  }
  if (previousActiveFilter) {
    previousActiveFilter.classList.remove('active');
  }
  previousActiveFilter = target;
  const isInitiallyActive = target.classList.contains('active');

  if (isInitiallyActive) {
    renderFilteredTasks('all');
    target.classList.remove('active');
  } else {
    renderFilteredTasks(target.dataset.filter);
    target.classList.add('active');
  }
});

renderTasks();
