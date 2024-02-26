'use strict';

const taskList = [];
/* Task structure:
{
  id: number,
  title: string,
  completed: boolean
}    
*/
const addTaskButton = document.querySelector('.btn-add');
const inputTaskTitle = document.querySelector('.input');
const taskListElement = document.querySelector('.list');
const editTaskModal = document.querySelector('.modal-edit');


const renderNewTask = (task) => {
  const taskElement = document.createElement('li');
  taskElement.classList.add('list-item');
  taskElement.dataset.id = task.id;
  taskElement.innerHTML = `
    <span>${task.title}</span>
    <button class="btn-complete">Complete</button>
    <button class="btn-edit">Edit</button>
    <button class="btn-delete">Delete</button>
  `;
  taskListElement.appendChild(taskElement);
  console.log(deleteTaskButton);
};

addTaskButton.addEventListener('click', () => {
  const title = inputTaskTitle.value;
  if (!title) {
    return;
  }
  const newTask = {
    id: new Date().getTime(),
    title: title,
    completed: false,
  };
  taskList.push(newTask);
  inputTaskTitle.value = '';
  taskListElement.classList.remove('hidden');
  renderNewTask(newTask);
});

taskListElement.addEventListener('click', (event) => {
  const target = event.target;
  const taskElement = target.closest('.list-item');
  if (!taskElement) {
    return;
  }
  const taskId = +taskElement.dataset.id;
  const task = taskList.find((task) => task.id === taskId);
  if (target.classList.contains('btn-complete')) {
    task.completed = !task.completed;
    taskElement.classList.toggle('completed');
  } else if (target.classList.contains('btn-delete')) {
    taskList.splice(taskList.indexOf(task), 1);
    taskElement.remove();
  } else if (target.classList.contains('btn-edit')) {
    const newTitle = prompt('Enter new title', task.title);
    if (newTitle) {
      task.title = newTitle;
      taskElement.querySelector('span').textContent = newTitle;
    }
  }
});
