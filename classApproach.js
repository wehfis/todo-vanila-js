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
  static addEventListeners() {
    ToDoFormHandler.addTaskButton.addEventListener('click', ToDoFormHandler.handleAddTask);
    TaskFilterHandler.clearCompletedTaskButton.addEventListener('click', TaskFilterHandler.clearCompleted);
    TaskListHandler.taskListElement.addEventListener('click', TaskListHandler.handleCompleteDelete);
    TaskListHandler.taskListElement.addEventListener('dblclick', TaskListHandler.handleEditTask);
    TaskListHandler.taskListElement.addEventListener('keydown', TaskListHandler.handleSaveEdittedTask);
    TaskFilterHandler.filterButtons.addEventListener('click', TaskFilterHandler.handleFilterButtons);
  }
}

class TaskListHandler {
  static taskListElement;
  static taskListElementSelector = '.list';

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
      TaskFilterHandler.turnFilters(tasks.length - 1 > 0);
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
        TaskFilterHandler.turnFilters(tasks.length - 1 > 0);
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
      TaskFilterHandler.turnFilters(tasks.length - 1 > 0);
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
  static async renderTasks() {
    TaskListHandler.taskListElement.innerHTML = '';
    const tasksData = await TaskAPI.getTasks();
    TaskFilterHandler.turnFilters(false);
    if (tasksData.length > 0) {
      TaskFilterHandler.turnFilters(true);
      TaskFilterHandler.clearFilters();
      tasksData.forEach((task) => TaskListHandler.renderNewTask(task));
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
    TaskListHandler.taskListElement.appendChild(taskElement);
  }
}

class ToDoFormHandler {
  static addTaskButton;
  static addTaskButtonSelector = '.btn-add';
  static inputTaskTitle;
  static inputTaskTitleSelector = '.input';
  
  static async handleAddTask() {
    const title = ToDoFormHandler.inputTaskTitle.value;
    if (!title || title.trim() === '') {
      return;
    }
    TaskFilterHandler.clearFilters();
    const newTask = new Task(title);
    TaskAPI.addTask(newTask);
    TaskListHandler.renderTasks();

    ToDoFormHandler.inputTaskTitle.value = '';
    const currentTasks = await TaskAPI.getTasks();
    if (currentTasks.length > 0) {
      TaskFilterHandler.turnFilters(true);
    }
  }
}

class TaskFilterHandler {
  static clearCompletedTaskButton;
  static clearCompletedTaskButtonSelector = '.btn-clear';
  static filterButtons;
  static filterButtonsSelelector = '.filter';
  static defaultFilterOption;
  static defaultFilterOptionSelector = '.btn-filter[data-filter="all"]';
  static previousActiveFilter;

  static async clearCompleted() {
    const tasks = await TaskAPI.getTasks();
    tasks
      .filter((task) => task.completed)
      .forEach((task) => TaskAPI.removeTask(task.id));
    TaskListHandler.renderTasks();
  }
  static async filterTasks(filterOption) {
    TaskListHandler.taskListElement.innerHTML = '';
    const tasks = await TaskAPI.getTasks();
    if (tasks.length < 1) {
      return;
    }
    switch (filterOption) {
      case FilterOption.Active:
        tasks.forEach((task) => {
          if (!task.completed) {
            TaskListHandler.renderNewTask(task);
          }
        });
        return;
      case FilterOption.Completed:
        tasks.forEach((task) => {
          if (task.completed) {
            TaskListHandler.renderNewTask(task);
          }
        });
        return;
      default:
        tasks.forEach((task) => TaskListHandler.renderNewTask(task));
        return;
    }
  }
  static async handleFilterButtons(event) {
    const target = event.target;
    if (!target.dataset.filter) {
      return;
    }
    if (TaskFilterHandler.previousActiveFilter) {
      TaskFilterHandler.previousActiveFilter.classList.remove(FilterOption.Active);
    }
    TaskFilterHandler.previousActiveFilter = target;
    const isInitiallyActive = target.classList.contains(FilterOption.Active);

    if (isInitiallyActive) {
      TaskFilterHandler.filterTasks(FilterOption.All);
      target.classList.remove(FilterOption.Active);
    } else {
      TaskFilterHandler.filterTasks(target.dataset.filter);
      target.classList.add(FilterOption.Active);
    }
  }
  static turnFilters(turnOn) {
    if (turnOn) {
      TaskFilterHandler.filterButtons.classList.remove(TaskListDOM.hiddenClass);
      TaskFilterHandler.clearCompletedTaskButton.classList.remove(TaskListDOM.hiddenClass);
    } else {
      TaskFilterHandler.filterButtons.classList.add(TaskListDOM.hiddenClass);
      TaskFilterHandler.clearCompletedTaskButton.classList.add(TaskListDOM.hiddenClass);
    }
  }
  static clearFilters() {
    if (TaskFilterHandler.previousActiveFilter) {
      TaskFilterHandler.previousActiveFilter.classList.remove(FilterOption.Active);
      TaskFilterHandler.defaultFilterOption.classList.add(FilterOption.Active);
      TaskFilterHandler.previousActiveFilter = TaskFilterHandler.defaultFilterOption;
    }
  }
}

class ToDoApp {
  static async start() {
    ToDoApp.initElements();
    await TaskListHandler.renderTasks();
  }
  static initElements() {
    ToDoFormHandler.addTaskButton = document.querySelector(ToDoFormHandler.addTaskButtonSelector);
    TaskFilterHandler.clearCompletedTaskButton = document.querySelector(TaskFilterHandler.clearCompletedTaskButtonSelector);
    ToDoFormHandler.inputTaskTitle = document.querySelector(ToDoFormHandler.inputTaskTitleSelector);
    TaskListHandler.taskListElement = document.querySelector(TaskListHandler.taskListElementSelector);
    TaskFilterHandler.filterButtons = document.querySelector(TaskFilterHandler.filterButtonsSelelector);
    TaskFilterHandler.defaultFilterOption = document.querySelector(TaskFilterHandler.defaultFilterOptionSelector);
  }
}

TaskListDOM.renderHTML();
ToDoApp.start();
TaskListDOM.addEventListeners();
