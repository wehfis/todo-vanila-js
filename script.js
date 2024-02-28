'use strict';
/* Task structure:
{
  id: number,
  title: string,
  completed: boolean
}    
*/
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
  <button class="btn-clear">Clear completed</button>
  <ul class="list hidden"></ul>
  <div class="filter">
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

const renderTasks = () => {
  const tasksData = getFromLocalStorage('tasks');
  if (tasksData.length > 0) tasksData.forEach((task) => renderNewTask(task));
  taskListElement.classList.remove('hidden');
};

const renderNewTask = (task) => {
  taskListElement.classList.remove('hidden');
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
  let data = localStorage.getItem(key);
  data = data ? JSON.parse(data) : [];
  data.push(newData);
  localStorage.setItem(key, JSON.stringify(data));
};

const removeFromLocalStorage = (key, id) => {
  let data = localStorage.getItem(key);
  data = data ? JSON.parse(data) : [];
  data = data.filter((item) => item.id !== id);
  localStorage.setItem(key, JSON.stringify(data));
};

const updateLocalStorage = (key, id, newTask) => {
  let tasks = getFromLocalStorage(key);
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, ...newTask };
    }
    return task;
  });
  localStorage.setItem(key, JSON.stringify(tasks));
};

const getFromLocalStorage = (key) => {
  const tasksData = localStorage.getItem(key);
  return tasksData ? JSON.parse(tasksData) : [];
};

addTaskButton.addEventListener('click', () => {
  const title = inputTaskTitle.value;
  if (!title || title.trim() === '') return;

  const newTask = {
    id: new Date().getTime(),
    title: title,
    completed: false,
  };
  appendToLocalStorage('tasks', newTask);
  inputTaskTitle.value = '';
  renderNewTask(newTask);
});

clearCompletedTaskButton.addEventListener('click', () => {
  const tasks = getFromLocalStorage('tasks');
  tasks.forEach((task) => {
    if (task.completed) {
      removeFromLocalStorage('tasks', task.id);
      document.querySelector(`[data-id="${task.id}"]`).remove();
    }
  });
});

taskListElement.addEventListener('click', (event) => {
  const target = event.target;
  const taskElement = target.closest('.list-item');
  const taskInput = taskElement.querySelector('.input-task');
  if (!taskElement) {
    return;
  }
  const taskId = +taskElement.dataset.id;
  const task = getFromLocalStorage('tasks').find((task) => task.id === taskId);
  if (target.dataset.action === 'complete') {
    updateLocalStorage('tasks', taskId, { completed: !task.completed });
    taskInput.classList.toggle('completed');
  } else if (target.dataset.action === 'delete') {
    removeFromLocalStorage('tasks', taskId);
    taskElement.remove();
  }
});

taskListElement.addEventListener('dblclick', (event) => {
  const target = event.target;
  if (!target.dataset.title) return;
  if (target.tagName === 'INPUT') return;
  const editInput = document.createElement('input');
  editInput.value = target.textContent;
  editInput.dataset.title = target.dataset.title;
  editInput.classList = target.classList;
  target.replaceWith(editInput);
  editInput.focus();
});

taskListElement.addEventListener('keydown', (event) => {
  const target = event.target;
  if (!target.dataset.title) return;
  if (event.key === 'Enter') {
    const taskId = +target.closest('.list-item').dataset.id;
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
  if (!target.dataset.filter) return;
  if (target.dataset.filter === 'all') {
    taskListElement.innerHTML = '';
    renderTasks();
  } else if (target.dataset.filter === 'active') {
    const tasks = getFromLocalStorage('tasks');
    taskListElement.innerHTML = '';
    tasks.forEach((task) => {
      if (!task.completed) renderNewTask(task);
    });
  } else if (target.dataset.filter === 'completed') {
    const tasks = getFromLocalStorage('tasks');
    taskListElement.innerHTML = '';
    tasks.forEach((task) => {
      if (task.completed) renderNewTask(task);
    });
  }
});

renderTasks();
