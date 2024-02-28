'use strict';

// todo:
// add datasets checks instead of class checks

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
  <div class="container">
    <div class="modal-edit hidden">
      <input type="text" class="input-edit">
      <button class="btn-save">Save</button>
  </div>
  <input type="text" class="input" placeholder="Write new task here...">
  <button class="btn-add">Add</button>
  <ul class="list hidden"></ul>
  `;
};
generatePage();

const addTaskButton = document.querySelector('.btn-add');
const inputTaskTitle = document.querySelector('.input');
const taskListElement = document.querySelector('.list');
const editTaskModal = document.querySelector('.modal-edit');
const inputs = document.querySelectorAll('.task-input');

const renderTasks = () => {
  const tasksData = getTasks('tasks');
  if (!tasksData) return;
  taskListElement.classList.remove('hidden');
  tasksData.forEach((task) => renderNewTask(task));
};

const renderNewTask = (task) => {
  taskListElement.classList.remove('hidden');
  const taskTitleElement = document.createElement('input');
  taskTitleElement.value = task.title;
  taskTitleElement.classList.add('input-task');
  taskTitleElement.classList.add(task.completed ? 'completed' : 'new');
  const taskElement = document.createElement('li');
  taskElement.classList.add('list-item');
  taskElement.dataset.id = task.id;
  taskElement.innerHTML += `
  <button class="btn-complete">Complete</button>
  <button class="btn-delete">Delete</button>
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
  let tasks = getTasks(key);
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, ...newTask };
    }
    return task;
  });
  localStorage.setItem(key, JSON.stringify(tasks));
};

const getTasks = (key) => {
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

taskListElement.addEventListener('click', (event) => {
  event.target.blur();
  const target = event.target;
  const taskElement = target.closest('.list-item');
  const taskInput = taskElement.querySelector('.input-task');
  if (!taskElement) {
    return;
  }
  const taskId = +taskElement.dataset.id;
  const task = getTasks('tasks').find((task) => task.id === taskId);
  if (target.classList.contains('btn-complete')) {
    updateLocalStorage('tasks', taskId, { completed: !task.completed });
    taskInput.classList.toggle('completed');
  } else if (target.classList.contains('btn-delete')) {
    removeFromLocalStorage('tasks', taskId);
    taskElement.remove();
  }
});

taskListElement.addEventListener('dblclick', (event) => {
  event.target.focus();
});

taskListElement.addEventListener('keyup', (event) => {
  const target = event.target;
  console.log(target.value);
  if (!target.classList.contains('input-task')) return;
  if (event.key === 'Enter') {
    const taskId = +target.closest('.list-item').dataset.id;
    updateLocalStorage('tasks', taskId, { title: target.value });
    event.target.blur();
  }
});

renderTasks();
