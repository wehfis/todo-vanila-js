'use strict';

class EventEmitter {
  events;
  constructor() {
    this.events = {};
  }

  subscribe(eventName, callback) {
    !this.events[eventName] && (this.events[eventName] = []);
    this.events[eventName].push(callback);
  }

  unsubscribe(eventName, callback) {
    this.events[eventName] = this.events[eventName].filter(
      (eventCallback) => callback !== eventCallback
    );
  }

  emit(eventName, ...args) {
    if (this.events[eventName]) {
      this.events[eventName].forEach((listener) => listener(...args));
    }
  }
}

const serverAPI = 'http://localhost:3000';
const body = document.querySelector('body');

class Task {
  id;
  title;
  completed;
  constructor(title) {
    this.id = Date.now().toString();
    this.title = title;
    this.completed = false;
  }
}

class TaskList {
  static async getTasks() {
    try {
      const response = await fetch(`${serverAPI}/tasks`);
      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error(`ERROR FETCHING TASKS DATA: ${error}`);
      return [];
    }
  }

  static async removeTask(taskId) {
    try {
      await fetch(`${serverAPI}/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`ERROR DELETING TASK: ${error}`);
    }
  }

  static async updateTask(taskId, newTask) {
    try {
      await fetch(`${serverAPI}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(newTask),
      });
    } catch (error) {
      console.error(`ERROR UPDATING TASK: ${error}`);
    }
  }

  static async getTaskById(taskId) {
    try {
      const response = await fetch(`${serverAPI}/tasks/${taskId}`);
      const task = await response.json();
      return task;
    } catch (error) {
      console.error(`ERROR UPDATING TASK: ${error}`);
    }
  }

  static async handleCompleteDelete(event) {
    // handler
    const target = event.target;

    const taskElement = target.closest('.list-item');
    if (!taskElement) {
      return;
    }
    const taskId = +taskElement.dataset.id;
    const tasks = await TaskList.getTasks();

    if (target.dataset.action === 'complete') {
      const task = await TaskList.getTaskById(taskId);
      TaskList.updateTask(taskId, { ...task, completed: !task.completed });
      const taskInput = taskElement.querySelector('.input-task');
      taskInput.classList.toggle('completed');
    } else if (target.dataset.action === 'delete') {
      TaskList.removeTask(taskId);
      taskElement.remove();
      ToDoApp.turnFilters(tasks.length - 1 > 0);
    }
  }
  static handleEditTask(event) {
    // handler
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

    editInput.addEventListener('blur', TaskList.saveOnBlur.bind(null, taskId), {
      once: true,
    });
  }
  static async handleSaveEdittedTask(event) {
    // handler
    const target = event.target;
    if (!target.dataset.title) return;

    const taskId = +target.closest('.list-item').dataset.id;

    if (event.key === 'Enter') {
      if (target.value.trim() === '' || !target.value) {
        await TaskList.removeTask(taskId);
        target.closest('.list-item').remove();
      }
      await TaskList.updateTask(taskId, {
        ...await TaskList.getTaskById(taskId),
        title: target.value,
      });

      const labelOutput = document.createElement('label');

      labelOutput.textContent = target.value;
      labelOutput.classList = target.classList;
      labelOutput.dataset.title = target.dataset.title;

      target.replaceWith(labelOutput);
    }
  }
  static async saveOnBlur(taskId, event) {
    const target = event.target;
    const task = target.closest('.list-item');
    if (target.value.trim() === '' || !target.value) {
      await TaskList.removeTask(taskId);
      task.remove();
    }
    const labelOutput = document.createElement('label');
    labelOutput.textContent = target.value;
    labelOutput.classList = target.classList;
    labelOutput.dataset.title = target.dataset.title;
    target.replaceWith(labelOutput);
    await TaskList.updateTask(taskId, {
      ...await TaskList.getTaskById(taskId),
      title: target.value,
    });
  }
}

class ToDoForm {
  static async addTask(task) {
    try {
      await fetch(`${serverAPI}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
    } catch (error) {
      console.error(`ERROR POSTING TASK: ${error}`);
    }
  }
  static async handleAddTask() {
    // handler
    const title = ToDoApp.inputTaskTitle.value;
    if (!title || title.trim() === '') {
      return;
    }
    ToDoApp.clearFilters();
    const newTask = new Task(title);
    ToDoForm.addTask(newTask);
    ToDoApp.renderTasks();

    ToDoApp.inputTaskTitle.value = '';
    const currentTasks = await TaskList.getTasks();
    if (currentTasks.length > 0) {
      ToDoApp.turnFilters(true);
    }
  }
}

const FilterOption = {
  All: 'all',
  Active: 'active',
  Completed: 'completed',
};

class TaskFilter {
  static async clearCompleted() {
    // handler
    const tasks = await TaskList.getTasks();
    tasks
      .filter((task) => task.completed)
      .forEach((task) => TaskList.removeTask(task.id));
    ToDoApp.renderTasks();
  }
  static async filterTasks(filterOption) {
    ToDoApp.taskListElement.innerHTML = '';
    const tasks = await TaskList.getTasks();
    if (tasks.length < 1) {
      return;
    }
    switch (filterOption) {
      case FilterOption.Active:
        tasks.forEach((task) => {
          if (!task.completed) {
            ToDoApp.renderNewTask(task);
          }
        });
        return;
      case FilterOption.Completed:
        tasks.forEach((task) => {
          if (task.completed) {
            ToDoApp.renderNewTask(task);
          }
        });
        return;
      default:
        tasks.forEach((task) => ToDoApp.renderNewTask(task));
        return;
    }
  }
  static async handleFilterButtons(event) {
    // handler
    const target = event.target;
    if (!target.dataset.filter) {
      return;
    }
    if (ToDoApp.previousActiveFilter) {
      ToDoApp.previousActiveFilter.classList.remove('active');
    }
    ToDoApp.previousActiveFilter = target;
    const isInitiallyActive = target.classList.contains('active');

    if (isInitiallyActive) {
      TaskFilter.filterTasks('all');
      target.classList.remove('active');
    } else {
      TaskFilter.filterTasks(target.dataset.filter);
      target.classList.add('active');
    }
  }
}

class ToDoApp {
  static addTaskButton;
  static clearCompletedTaskButton;
  static inputTaskTitle;
  static taskListElement;
  static inputs;
  static filterButtons;
  static defaultFilterOption;
  static previousActiveFilter;
  static async init(body) {
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
    ToDoApp.initElements();
    await ToDoApp.renderTasks();
  }
  static initElements() {
    ToDoApp.addTaskButton = document.querySelector('.btn-add');
    ToDoApp.clearCompletedTaskButton = document.querySelector('.btn-clear');
    ToDoApp.inputTaskTitle = document.querySelector('.input');
    ToDoApp.taskListElement = document.querySelector('.list');
    ToDoApp.inputs = document.querySelectorAll('.task-input');
    ToDoApp.filterButtons = document.querySelector('.filter');
    ToDoApp.defaultFilterOption = document.querySelector(
      '.btn-filter[data-filter="all"]'
    );
  }
  static turnFilters(turnOn) {
    if (turnOn) {
      ToDoApp.filterButtons.classList.remove('hidden');
      ToDoApp.clearCompletedTaskButton.classList.remove('hidden');
    } else {
      ToDoApp.filterButtons.classList.add('hidden');
      ToDoApp.clearCompletedTaskButton.classList.add('hidden');
    }
  }
  static clearFilters() {
    if (ToDoApp.previousActiveFilter) {
      ToDoApp.previousActiveFilter.classList.remove('active');
      ToDoApp.defaultFilterOption.classList.add('active');
      ToDoApp.previousActiveFilter = ToDoApp.defaultFilterOption;
    }
  }
  static async renderTasks() {
    ToDoApp.taskListElement.innerHTML = '';
    const tasksData = await TaskList.getTasks();
    ToDoApp.turnFilters(false);
    if (tasksData.length > 0) {
      ToDoApp.turnFilters(true);
      ToDoApp.clearFilters();
      tasksData.forEach((task) => ToDoApp.renderNewTask(task));
    }
  }
  static renderNewTask(task) {
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
    ToDoApp.taskListElement.appendChild(taskElement);
  }
}
// Init HTML page
ToDoApp.init(body);

// Subscribe to events
const emitter = new EventEmitter();
emitter.subscribe('add task', ToDoForm.handleAddTask);
emitter.subscribe('clear completed', TaskFilter.clearCompleted);
emitter.subscribe('complete/delete buttons', TaskList.handleCompleteDelete);
emitter.subscribe('edit task', TaskList.handleEditTask);
emitter.subscribe('save editted task', TaskList.handleSaveEdittedTask);
emitter.subscribe('filter buttons', TaskFilter.handleFilterButtons);

// Emit events
ToDoApp.addTaskButton.addEventListener('click', () => {
  emitter.emit('add task');
});
ToDoApp.clearCompletedTaskButton.addEventListener('click', () => {
  emitter.emit('clear completed');
});
ToDoApp.taskListElement.addEventListener('click', (event) => {
  emitter.emit('complete/delete buttons', event);
});
ToDoApp.taskListElement.addEventListener('dblclick', (event) => {
  emitter.emit('edit task', event);
});
ToDoApp.taskListElement.addEventListener('keydown', (event) => {
  emitter.emit('save editted task', event);
});
ToDoApp.filterButtons.addEventListener('click', (event) => {
  emitter.emit('filter buttons', event);
});
