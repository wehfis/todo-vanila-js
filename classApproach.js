'use strict';

const FilterOption = {
  All: 'all',
  Active: 'active',
  Completed: 'completed',
};
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
  static taskListElement;
  static taskListElementClass = 'list';
  static emitter;
  
  static async renderNewTaskDOM(taskElement) {
    TaskListDOM.taskListElement.appendChild(taskElement);
  }

  static async renderHTML(body) {
    TaskListDOM.taskListElement = document.createElement('ul');
    TaskListDOM.taskListElement.classList.add(TaskListDOM.taskListElementClass);
    body.appendChild(TaskListDOM.taskListElement);
  }
}
class TaskListHandler {

  static async handleCompleteDelete(event) {
    const target = event.target;

    const taskElement = target.closest(ToDoApp.listItem);
    if (!taskElement) {
      return;
    }
    const taskId = +taskElement.dataset.id;
    const tasks = await TaskAPI.getTasks();
    if (target.dataset.action === 'complete') {
      const task = await TaskAPI.getTaskById(taskId);
      TaskAPI.updateTask(taskId, { ...task, completed: !task.completed });
      const taskInput = taskElement.querySelector(ToDoApp.inputTask);
      taskInput.classList.toggle(ToDoApp.completedClass);
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
    const taskId = +target.closest(ToDoApp.listItem).dataset.id;

    const editInput = await TaskListHandler.replaceElement('input', target);
    editInput.focus();

    editInput.addEventListener('blur', TaskListHandler.saveOnBlur.bind(null, taskId), {
      once: true,
    });
  }
  static async handleSaveEdittedTask(event) {
    const target = event.target;
    if (!target.dataset.title) return;

    const taskId = +target.closest(ToDoApp.listItem).dataset.id;
    const tasks = await TaskAPI.getTasks();
    if (event.key === 'Enter') {
      if (target.value.trim() === '' || !target.value) {
        await TaskAPI.removeTask(taskId);
        target.closest(ToDoApp.listItem).remove();
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
    const task = target.closest(ToDoApp.listItem);
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
}
class ToDoFormDOM {
  static addTaskButton;
  static addTaskButtonClass = 'btn-add';
  static inputTaskTitle;
  static inputTaskTitleClass = 'input';

  static async renderHTML(body) {
    ToDoFormDOM.inputTaskTitle = document.createElement('input');
    ToDoFormDOM.inputTaskTitle.classList.add(ToDoFormDOM.inputTaskTitleClass);
    ToDoFormDOM.inputTaskTitle.placeholder = 'Write new task here...';

    ToDoFormDOM.addTaskButton = document.createElement('button');
    ToDoFormDOM.addTaskButton.classList.add(ToDoFormDOM.addTaskButtonClass);
    ToDoFormDOM.addTaskButton.textContent = 'Add';

    body.appendChild(ToDoFormDOM.inputTaskTitle);
    body.appendChild(ToDoFormDOM.addTaskButton);
  }
}
class ToDoFormHandler {
  
  static async handleAddTask() {
    const title = ToDoFormDOM.inputTaskTitle.value;
    if (!title || title.trim() === '') {
      return;
    }
    TaskFilterHandler.clearFilters();
    const newTask = new Task(title);
    TaskAPI.addTask(newTask);
    TaskRender.renderTasks();

    ToDoFormDOM.inputTaskTitle.value = '';
    const currentTasks = await TaskAPI.getTasks();
    if (currentTasks.length > 0) {
      TaskFilterHandler.turnFilters(true);
    }
  }
}
class TaskFilterDOM {
  static clearCompletedTaskButton;
  static clearCompletedTaskButtonClass = 'btn-clear';
  static filterButtons;
  static filterButtonsClass = 'filter';
  static defaultFilterOption;
  static defaultFilterOptionClass = 'btn-filter';
  static defaultFilterOptionDataset = 'data-filter="all"';
  static previousActiveFilter = null;

  static renderHTML(body) {
    TaskFilterDOM.clearCompletedTaskButton = document.createElement('button');
    TaskFilterDOM.clearCompletedTaskButton.classList.add(TaskFilterDOM.clearCompletedTaskButtonClass);
    TaskFilterDOM.clearCompletedTaskButton.textContent = 'Clear completed';

    TaskFilterDOM.filterButtons = document.createElement('div');
    TaskFilterDOM.filterButtons.classList.add(TaskFilterDOM.filterButtonsClass);
    TaskFilterDOM.filterButtons.classList.add(ToDoApp.hiddenClass);

    TaskFilterDOM.defaultFilterOption = document.createElement('button');
    TaskFilterDOM.defaultFilterOption.classList.add(TaskFilterDOM.defaultFilterOptionClass);
    TaskFilterDOM.defaultFilterOption.dataset.filter = FilterOption.All;
    TaskFilterDOM.defaultFilterOption.textContent = FilterOption.All;

    const ActiveFilter = document.createElement('button');
    ActiveFilter.classList.add(TaskFilterDOM.defaultFilterOptionClass);
    ActiveFilter.dataset.filter = FilterOption.Active;
    ActiveFilter.textContent = FilterOption.Active;

    const CompletedFilter = document.createElement('button');
    CompletedFilter.classList.add(TaskFilterDOM.defaultFilterOptionClass);
    CompletedFilter.dataset.filter = FilterOption.Completed;
    CompletedFilter.textContent = FilterOption.Completed;

    body.appendChild(TaskFilterDOM.clearCompletedTaskButton);
    body.appendChild(TaskFilterDOM.filterButtons);
    TaskFilterDOM.filterButtons.appendChild(TaskFilterDOM.defaultFilterOption);
    TaskFilterDOM.filterButtons.appendChild(ActiveFilter);
    TaskFilterDOM.filterButtons.appendChild(CompletedFilter);
  }
}
class TaskFilterHandler {

  static async clearCompleted() {
    const tasks = await TaskAPI.getTasks();
    tasks
      .filter((task) => task.completed)
      .forEach((task) => TaskAPI.removeTask(task.id));
      TaskRender.renderTasks();
  }
  static async filterTasks(filterOption) {
    TaskListDOM.taskListElement.innerHTML = '';
    const tasks = await TaskAPI.getTasks();
    if (tasks.length < 1) {
      return;
    }
    switch (filterOption) {
      case FilterOption.Active:
        tasks.forEach((task) => {
          if (!task.completed) {
            TaskRender.renderNewTask(task);
          }
        });
        return;
      case FilterOption.Completed:
        tasks.forEach((task) => {
          if (task.completed) {
            TaskRender.renderNewTask(task);
          }
        });
        return;
      default:
        tasks.forEach((task) => TaskRender.renderNewTask(task));
        return;
    }
  }
  static async handleFilterButtons(event) {
    const target = event.target;
    if (!target.dataset.filter) {
      return;
    }
    if (TaskFilterDOM.previousActiveFilter) {
      TaskFilterDOM.previousActiveFilter.classList.remove(FilterOption.Active);
    }
    TaskFilterDOM.previousActiveFilter = target;
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
      TaskFilterDOM.filterButtons.classList.remove(ToDoApp.hiddenClass);
      TaskFilterDOM.clearCompletedTaskButton.classList.remove(ToDoApp.hiddenClass);
    } else {
      TaskFilterDOM.filterButtons.classList.add(ToDoApp.hiddenClass);
      TaskFilterDOM.clearCompletedTaskButton.classList.add(ToDoApp.hiddenClass);
    }
  }
  static clearFilters() {
    if (TaskFilterDOM.previousActiveFilter) {
      TaskFilterDOM.previousActiveFilter.classList.remove(FilterOption.Active);
      TaskFilterDOM.defaultFilterOption.classList.add(FilterOption.Active);
      TaskFilterDOM.previousActiveFilter = TaskFilterDOM.defaultFilterOption;
    }
  }
}
class TaskRender {
  static emitter
  static async renderTasks() {
    TaskListDOM.taskListElement.innerHTML = '';
    const tasksData = await TaskAPI.getTasks();
    TaskFilterHandler.turnFilters(false);
    if (tasksData.length > 0) {
      TaskFilterHandler.turnFilters(true);
      TaskFilterHandler.clearFilters();
      tasksData.forEach((task) => TaskRender.renderNewTask(task));
    }
  }
  static renderNewTask(task) {
    const taskTitleElement = document.createElement('label');
    taskTitleElement.textContent = task.title;
    taskTitleElement.classList.add(ToDoApp.inputTaskClass);
    taskTitleElement.classList.add(task.completed ? `${ToDoApp.completedClass}` : `${ToDoApp.incompletedClass}`);
    taskTitleElement.dataset.title = task.title;

    const taskElement = document.createElement('li');
    taskElement.classList.add(ToDoApp.listItemClass);
    taskElement.dataset.id = task.id;
    taskElement.innerHTML += `
    <button class="${ToDoApp.completeButtonClass}" data-action="complete">Complete</button>
    <button class="${ToDoApp.deleteButtonClass}" data-action="delete">Delete</button>
    `;
    taskElement.appendChild(taskTitleElement);
    TaskEvents.emitter.emit('renderNewTask', taskElement);
  }
}
class TaskEvents {
  static emitter;
  static addEventEmitter() {
    TaskEvents.emitter = new EventEmitter();
    TaskEvents.emitter.subscribe('renderNewTask', TaskListDOM.renderNewTaskDOM);
  }
  static addEventListeners() {
    ToDoFormDOM.addTaskButton.addEventListener('click', ToDoFormHandler.handleAddTask);
    TaskFilterDOM.clearCompletedTaskButton.addEventListener('click', TaskFilterHandler.clearCompleted);
    TaskListDOM.taskListElement.addEventListener('click', TaskListHandler.handleCompleteDelete);
    TaskListDOM.taskListElement.addEventListener('dblclick', TaskListHandler.handleEditTask);
    TaskListDOM.taskListElement.addEventListener('keydown', TaskListHandler.handleSaveEdittedTask);
    TaskFilterDOM.filterButtons.addEventListener('click', TaskFilterHandler.handleFilterButtons);
  }
}
class ToDoApp {
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

  static async renderHTML(body) {
    const h1 = document.createElement('h1');
    h1.textContent = 'TODO List';

    const comment = document.createElement('p');
    comment.classList.add('comment');
    comment.textContent = 'TIPS:';
    const comment1 = document.createElement('p');
    comment1.classList.add('comment');
    comment1.textContent = 'to edit task double click to it\'s title';
    const comment2 = document.createElement('p');
    comment2.classList.add('comment');
    comment2.textContent = 'to finish task edition click \'Enter\' key';
    const comment3 = document.createElement('p');
    comment3.classList.add('comment');
    comment3.textContent = 'task title saves only after finishing edition';

    ToDoApp.body.appendChild(h1);
    ToDoApp.body.appendChild(comment);
    ToDoApp.body.appendChild(comment1);
    ToDoApp.body.appendChild(comment2);
    ToDoApp.body.appendChild(comment3);
  }
  static async start() {
    TaskEvents.addEventEmitter();
    await ToDoApp.renderHTML(ToDoApp.body);
    await ToDoFormDOM.renderHTML(ToDoApp.body);
    await TaskListDOM.renderHTML(ToDoApp.body);
    await TaskFilterDOM.renderHTML(ToDoApp.body);
    await TaskRender.renderTasks();
    TaskEvents.addEventListeners();
  }
}

ToDoApp.start();
