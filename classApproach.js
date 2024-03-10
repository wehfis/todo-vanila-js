'use strict';

const FilterOption = {
  All: 'all',
  Active: 'active',
  Completed: 'completed',
};

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

class TaskAPI {
  static serverAPI = 'http://localhost:3000';
  static async getTasks() {
    try {
      const response = await fetch(`${TaskAPI.serverAPI}/tasks`);
      return await response.json();
    } catch (error) {
      console.error(`ERROR FETCHING TASKS DATA: ${error}`);
      return [];
    }
  }

  static async addTask(task) {
    try {
      await fetch(`${TaskAPI.serverAPI}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
    } catch (error) {
      console.error(`ERROR POSTING TASK: ${error}`);
    }
  }

  static async removeTask(taskId) {
    try {
      await fetch(`${TaskAPI.serverAPI}/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`ERROR DELETING TASK: ${error}`);
    }
  }

  static async updateTask(taskId, newTask) {
    try {
      await fetch(`${TaskAPI.serverAPI}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(newTask),
      });
    } catch (error) {
      console.error(`ERROR UPDATING TASK: ${error}`);
    }
  }

  static async getTaskById(taskId) {
    try {
      const response = await fetch(`${TaskAPI.serverAPI}/tasks/${taskId}`);
      return await response.json();
    } catch (error) {
      console.error(`ERROR UPDATING TASK: ${error}`);
    }
  }
}

class TaskListDOM {
  static body = document.querySelector('body');
  static listItem = '.list-item';
  static inputTask = '.input-task';
  static listItemClass = 'list-item';
  static inputTaskClass = 'input-task';
  static completedClass = 'completed';
  static incompletedClass = 'new';
  static hiddenClass = 'hidden';
  static completeButtonClass = 'btn-complete';
  static deleteButtonClass = 'btn-delete';
  static async renderHTML() {
    TaskListDOM.body.innerHTML = `
      <h1>TODO List</h1>
      <p class="comment">TIPS:</p>
      <p class="comment">to edit task double click to it's title</p>
      <p class="comment">to finish task edition click 'Enter' key</p>
      <p class="comment">task title saves only after finishing edition</p>
      <input type="text" class="input" placeholder="Write new task here...">
      <button class="btn-add">Add</button> <br>
      <button class="btn-clear ${TaskListDOM.hiddenClass}">Clear completed</button>
      <ul class="list"></ul>
      <div class="filter ${TaskListDOM.hiddenClass}">
        <button class="btn-filter" data-filter="all">all</button>
        <button class="btn-filter" data-filter="active">active</button>
        <button class="btn-filter" data-filter="completed">completed</button>
      </div>
    `;
  }
}

class TaskListHandler {
  static async handleCompleteDelete(event) {
    const target = event.target;

    const taskElement = target.closest(TaskListDOM.listItem);
    if (!taskElement) {
      return;
    }
    const taskId = +taskElement.dataset.id;
    const tasks = await TaskAPI.getTasks();
    if (target.dataset.action === 'complete') {
      const task = await TaskAPI.getTaskById(taskId);
      TaskAPI.updateTask(taskId, { ...task, completed: !task.completed });
      const taskInput = taskElement.querySelector(TaskListDOM.inputTask);
      taskInput.classList.toggle(TaskListDOM.completedClass);
    } else if (target.dataset.action === 'delete') {
      TaskAPI.removeTask(taskId);
      taskElement.remove();
      ToDoApp.turnFilters(tasks.length - 1 > 0);
    }
  }
  static async handleEditTask(event) {
    const target = event.target;
    if (!target.dataset.title) {
      return;
    }
    if (target.tagName === 'INPUT') {
      return;
    }
    const taskId = +target.closest(TaskListDOM.listItem).dataset.id;

    const editInput = await TaskListHandler.replaceElement('input', target);
    editInput.focus();

    editInput.addEventListener('blur', TaskListHandler.saveOnBlur.bind(null, taskId), {
      once: true,
    });
  }
  static async handleSaveEdittedTask(event) {
    const target = event.target;
    if (!target.dataset.title) return;

    const taskId = +target.closest(TaskListDOM.listItem).dataset.id;
    const tasks = await TaskAPI.getTasks();
    if (event.key === 'Enter') {
      if (target.value.trim() === '' || !target.value) {
        await TaskAPI.removeTask(taskId);
        target.closest(TaskListDOM.listItem).remove();
        ToDoApp.turnFilters(tasks.length - 1 > 0);
        return;
      }
      await TaskAPI.updateTask(taskId, {
        ...await TaskAPI.getTaskById(taskId),
        title: target.value,
      });

      TaskListHandler.replaceElement('label', target);
    }
  }
  static async saveOnBlur(taskId, event) {
    const target = event.target;
    const task = target.closest(TaskListDOM.listItem);
    const tasks = await TaskAPI.getTasks();
    if (target.value.trim() === '' || !target.value) {
      await TaskAPI.removeTask(taskId);
      task.remove();
      ToDoApp.turnFilters(tasks.length - 1 > 0);
      return
    }
    TaskListHandler.replaceElement('label', target);

    await TaskAPI.updateTask(taskId, {
      ...await TaskAPI.getTaskById(taskId),
      title: target.value,
    });
  }
  static async replaceElement(element, target) {
    const newElement = document.createElement(element);
    if (element === 'input') {
      newElement.value = target.textContent;
      newElement.dataset.title = target.dataset.title;
      newElement.classList = target.classList;
    } else {
      newElement.textContent = target.value;
      newElement.classList = target.classList;
      newElement.dataset.title = target.dataset.title;
    }
    target.replaceWith(newElement);
    return newElement;
  }
}

class ToDoFormHandler {

  static async handleAddTask() {
    const title = ToDoApp.inputTaskTitle.value;
    if (!title || title.trim() === '') {
      return;
    }
    ToDoApp.clearFilters();
    const newTask = new Task(title);
    TaskAPI.addTask(newTask);
    ToDoApp.renderTasks();

    ToDoApp.inputTaskTitle.value = '';
    const currentTasks = await TaskAPI.getTasks();
    if (currentTasks.length > 0) {
      ToDoApp.turnFilters(true);
    }
  }
}

class TaskFilterHandler {
  static async clearCompleted() {
    const tasks = await TaskAPI.getTasks();
    tasks
      .filter((task) => task.completed)
      .forEach((task) => TaskAPI.removeTask(task.id));
    ToDoApp.renderTasks();
  }
  static async filterTasks(filterOption) {
    ToDoApp.taskListElement.innerHTML = '';
    const tasks = await TaskAPI.getTasks();
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
    const target = event.target;
    if (!target.dataset.filter) {
      return;
    }
    if (ToDoApp.previousActiveFilter) {
      ToDoApp.previousActiveFilter.classList.remove(FilterOption.Active);
    }
    ToDoApp.previousActiveFilter = target;
    const isInitiallyActive = target.classList.contains(FilterOption.Active);

    if (isInitiallyActive) {
      TaskFilterHandler.filterTasks(FilterOption.All);
      target.classList.remove(FilterOption.Active);
    } else {
      TaskFilterHandler.filterTasks(target.dataset.filter);
      target.classList.add(FilterOption.Active);
    }
  }
}

class ToDoApp {
  static addTaskButton = '.btn-add';
  static clearCompletedTaskButton = '.btn-clear';
  static inputTaskTitle = '.input';
  static taskListElement = '.list';
  static inputs = '.task-input';
  static filterButtons = '.filter';
  static defaultFilterOption = '.btn-filter[data-filter="all"]';
  static previousActiveFilter = null;
  static async start() {
    ToDoApp.initElements();
    await ToDoApp.renderTasks();
  }
  static async initElements() {
    ToDoApp.addTaskButton = document.querySelector(ToDoApp.addTaskButton);
    ToDoApp.clearCompletedTaskButton = document.querySelector(ToDoApp.clearCompletedTaskButton);
    ToDoApp.inputTaskTitle = document.querySelector(ToDoApp.inputTaskTitle);
    ToDoApp.taskListElement = document.querySelector(ToDoApp.taskListElement);
    ToDoApp.inputs = document.querySelectorAll(ToDoApp.inputs);
    ToDoApp.filterButtons = document.querySelector(ToDoApp.filterButtons);
    ToDoApp.defaultFilterOption = document.querySelector(ToDoApp.defaultFilterOption);
  }
  static turnFilters(turnOn) {
    if (turnOn) {
      ToDoApp.filterButtons.classList.remove(TaskListDOM.hiddenClass);
      ToDoApp.clearCompletedTaskButton.classList.remove(TaskListDOM.hiddenClass);
    } else {
      ToDoApp.filterButtons.classList.add(TaskListDOM.hiddenClass);
      ToDoApp.clearCompletedTaskButton.classList.add(TaskListDOM.hiddenClass);
    }
  }
  static clearFilters() {
    if (ToDoApp.previousActiveFilter) {
      ToDoApp.previousActiveFilter.classList.remove(FilterOption.Active);
      ToDoApp.defaultFilterOption.classList.add(FilterOption.Active);
      ToDoApp.previousActiveFilter = ToDoApp.defaultFilterOption;
    }
  }
  static async renderTasks() {
    ToDoApp.taskListElement.innerHTML = '';
    const tasksData = await TaskAPI.getTasks();
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
    taskTitleElement.classList.add(TaskListDOM.inputTaskClass);
    taskTitleElement.classList.add(task.completed ? `${TaskListDOM.completedClass}` : `${TaskListDOM.incompletedClass}`);
    taskTitleElement.dataset.title = task.title;

    const taskElement = document.createElement('li');
    taskElement.classList.add(TaskListDOM.listItemClass);
    taskElement.dataset.id = task.id;
    taskElement.innerHTML += `
    <button class="${TaskListDOM.completeButtonClass}" data-action="complete">Complete</button>
    <button class="${TaskListDOM.deleteButtonClass}" data-action="delete">Delete</button>
    `;
    taskElement.appendChild(taskTitleElement);
    ToDoApp.taskListElement.appendChild(taskElement);
  }
}

TaskListDOM.renderHTML();
ToDoApp.start();

ToDoApp.addTaskButton.addEventListener('click', ToDoFormHandler.handleAddTask);
ToDoApp.clearCompletedTaskButton.addEventListener('click', TaskFilterHandler.clearCompleted);
ToDoApp.taskListElement.addEventListener('click', TaskListHandler.handleCompleteDelete);
ToDoApp.taskListElement.addEventListener('dblclick', TaskListHandler.handleEditTask);
ToDoApp.taskListElement.addEventListener('keydown', TaskListHandler.handleSaveEdittedTask);
ToDoApp.filterButtons.addEventListener('click', TaskFilterHandler.handleFilterButtons);
