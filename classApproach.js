'use strict';

import { EventEmitter } from './EventEmitter';

const serverAPI = 'http://localhost:3000';
const body = document.querySelector('body');

class Task {
  #id;
  #title;
  #completed;
  constructor(title) {
    this.#id = Date.now();
    this.#title = title;
    this.#completed = false;
  }
  get id() {
    return this.#id;
  }
  get title() {
    return this.#title;
  }
  get completed() {
    return this.#completed;
  }
  set title(value) {
    if (!value || value.trim() === '') {
      this.delete();
    }
    this.#title = value;
  }
  set completed(value) {
    this.#completed = value;
  }
  toggleCompleted() {
    this.#completed = !this.#completed;
  }
  delete() {
    this.#id = null;
    this.#title = null;
    this.#completed = null;
  }
}

class TaskList {
  static async #fetchTasks() {
    try {
      const response = await fetch(`${serverAPI}/tasks`);
      const tasks = await response.json();
      console.log('FETCHED TASKS:', tasks);
      return tasks;
    } catch (error) {
      console.error(`ERROR FETCHING TASKS DATA: ${error}`);
      return [];
    }
  }

  static async getTasks() {
    console.log('GETTING TASKS');
    return await TaskList.#fetchTasks();
  }

  static async removeTask(taskId) {
    console.log('DELETING TASKS');
    try {
      await fetch(`${serverAPI}/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`ERROR DELETING TASK: ${error}`);
    }
  }

  static async updateTask(taskId, newTask) {
    console.log('PUTTING TASKS');
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
    return await TaskList.getTasks().find((task) => task.id === taskId);
  }
}

class ToDoForm {
  static async addTask(task) {
    console.log('POSTING TASKS');
    try {
      await fetch(`${serverAPI}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
    } catch (error) {
      console.error(`ERROR POSTING TASK: ${error}`);
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
    const tasks = TaskList.getTasks();
    tasks = tasks.filter((task) => !task.completed);
    tasks.forEach((task) => TaskList.removeTask(task.id));
    ToDoApp.renderTasks();
  }
  static async filterTasks(filterOption) {
    ToDoApp.taskListElement.innerHTML = '';
    const tasks = TaskList.getTasks();
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
    // ToDoApp.previousActiveFilter = defaultFilterOption;
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
    if (tasksData.length > 0) {
      ToDoApp.turnFilters(true);
      clearFilters();
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
  static saveOnBlur(taskId, event) {
    const target = event.target;
    const task = target.closest('.list-item');
    console.log(task);
    if (target.value.trim() === '' || !target.value) {
      TaskList.removeTask(taskId);
      task.remove();
    }
    const labelOutput = document.createElement('label');
    labelOutput.textContent = target.value;
    labelOutput.classList = target.classList;
    labelOutput.dataset.title = target.dataset.title;
    target.replaceWith(labelOutput);
    TaskList.updateTask(taskId, { ...TaskList.getTaskById(taskId), title: target.value });
  }
}

ToDoApp.init(body);
const emitter = new EventEmitter(); 

// TODO - add event listeners
