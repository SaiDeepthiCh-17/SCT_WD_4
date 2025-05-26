// DOM Elements
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const taskPriority = document.getElementById('task-priority');
const taskCategory = document.getElementById('task-category');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearAllBtn = document.getElementById('clear-all');
const themeToggle = document.getElementById('theme-toggle');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close');
const editTaskInput = document.getElementById('edit-task-input');
const editTaskDate = document.getElementById('edit-task-date');
const editTaskPriority = document.getElementById('edit-task-priority');
const editTaskCategory = document.getElementById('edit-task-category');
const saveEditBtn = document.getElementById('save-edit');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const taskCount = document.getElementById('task-count');
const completionMessage = document.getElementById('completion-message');

// App State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentEditTaskId = null;
let searchTerm = '';

// Initialize default date if empty
if (taskDate) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    taskDate.value = now.toISOString().slice(0, 16);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    checkTheme();
    createParticles();
});

// Add task event listeners
if (addBtn) {
    addBtn.addEventListener('click', addTask);
}

if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

// Search functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderTasks();
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.toLowerCase();
        renderTasks();
    });
}

// Clear buttons
if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
}

// Theme toggle
if (themeToggle) {
    themeToggle.addEventListener('change', toggleTheme);
}

// Modal controls
if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (editModal) editModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (editModal && e.target === editModal) {
        editModal.style.display = 'none';
    }
});

if (saveEditBtn) {
    saveEditBtn.addEventListener('click', saveEdit);
}

// Filter buttons
if (filterBtns) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
}

// Functions
function addTask() {
    if (!taskInput || taskInput.value.trim() === '') return;

    const newTask = {
        id: Date.now().toString(),
        text: taskInput.value.trim(),
        completed: false,
        date: taskDate ? taskDate.value : '',
        priority: taskPriority ? taskPriority.value : 'medium',
        category: taskCategory ? taskCategory.value : 'personal',
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateProgressBar();

    // Reset form
    if (taskInput) taskInput.value = '';
    if (taskDate) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        taskDate.value = now.toISOString().slice(0, 16);
    }
    if (taskPriority) taskPriority.value = 'medium';
    if (taskCategory) taskCategory.value = 'personal';
    if (taskInput) taskInput.focus();
}

function toggleComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const newCompleted = !task.completed;
            // Create confetti if task is being completed
            if (newCompleted) {
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                if (taskElement) {
                    createConfetti(taskElement);
                }
            }
            return { ...task,
                completed: newCompleted
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
    updateProgressBar();
    checkAllTasksCompleted();
}

function createConfetti(element) {
    if (!confetti || typeof confetti !== 'function') return;

    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.right) / 2;
    const y = (rect.top + rect.bottom) / 2;

    // Convert to normalized coordinates (0-1)
    const normalizedX = x / window.innerWidth;
    const normalizedY = y / window.innerHeight;

    confetti({
        particleCount: 50,
        spread: 60,
        origin: {
            x: normalizedX,
            y: normalizedY
        },
        colors: ['#7a6bff', '#00e1ff', '#ff5c8d'],
        zIndex: 1000
    });
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        // Add delete animation
        taskElement.style.animation = 'fadeOut 0.3s forwards';

        // Remove after animation completes
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateProgressBar();
        }, 300);
    } else {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateProgressBar();
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task || !editModal || !editTaskInput || !editTaskDate ||
        !editTaskPriority || !editTaskCategory) return;

    currentEditTaskId = id;
    editTaskInput.value = task.text;
    editTaskDate.value = task.date;
    editTaskPriority.value = task.priority;
    editTaskCategory.value = task.category;
    editModal.style.display = 'block';
}

function saveEdit() {
    if (!editTaskInput || editTaskInput.value.trim() === '' || !currentEditTaskId) return;

    tasks = tasks.map(task => {
        if (task.id === currentEditTaskId) {
            return {
                ...task,
                text: editTaskInput.value.trim(),
                date: editTaskDate ? editTaskDate.value : task.date,
                priority: editTaskPriority ? editTaskPriority.value : task.priority,
                category: editTaskCategory ? editTaskCategory.value : task.category
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
    updateProgressBar();
    if (editModal) editModal.style.display = 'none';
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateProgressBar();
}

function clearAll() {
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateProgressBar();
    }
}

function toggleTheme() {
    if (themeToggle && themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
}

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && themeToggle) {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        let formattedDate;
        if (isToday) {
            formattedDate = 'Today';
        } else if (isTomorrow) {
            formattedDate = 'Tomorrow';
        } else {
            formattedDate = date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        const time = date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${formattedDate} at ${time}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
}

function renderTasks() {
    if (!tasksList) return;

    let filteredTasks = tasks;

    // Apply search filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm) ||
            task.priority.toLowerCase().includes(searchTerm)
        );
    }

    // Apply status filter
    if (currentFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    // Clear list and render
    tasksList.innerHTML = '';

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks to display</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        li.setAttribute('draggable', 'true');

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-details">
                    <span class="task-date"><i class="far fa-calendar-alt"></i> ${formatDate(task.date)}</span>
                    <span class="task-category ${task.category}">${task.category}</span>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
            </div>
            <div class="task-buttons">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        tasksList.appendChild(li);

        // Add event listeners to the buttons
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');

        if (checkbox) {
            checkbox.addEventListener('change', () => toggleComplete(task.id));
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => editTask(task.id));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        }

        // Drag and drop functionality
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);
    });
}

// Progress Bar Functions
function updateProgressBar() {
    if (!progressFill || !progressText || !taskCount) return;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage}% Complete`;
    taskCount.textContent = `${completedTasks}/${totalTasks} Tasks`;

    // Add color transition based on completion percentage
    if (progressPercentage < 30) {
        progressFill.style.background = 'var(--primary-color)';
    } else if (progressPercentage < 70) {
        progressFill.style.background = 'var(--medium-priority)';
    } else {
        progressFill.style.background = 'var(--secondary-color)';
    }
}

function checkAllTasksCompleted() {
    if (!completionMessage) return;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    if (totalTasks > 0 && totalTasks === completedTasks) {
        triggerCompletionCelebration();
    }
}

function triggerCompletionCelebration() {
    if (!completionMessage || !confetti || typeof confetti !== 'function') return;

    completionMessage.classList.add('show');

    // Create confetti effect
    const confettiSettings = {
        particleCount: 200,
        spread: 160,
        origin: {
            y: 0.6
        }
    };

    confetti(confettiSettings);

    // Fire multiple bursts of confetti
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: {
                x: 0
            }
        });
    }, 500);

    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: {
                x: 1
            }
        });
    }, 900);

    // Hide the completion message after a delay
    setTimeout(() => {
        completionMessage.classList.remove('show');
    }, 5000);
}

// Drag and Drop Functionality
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem === this) return;

    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = this.getAttribute('data-id');

    // Reorder tasks array
    const draggedIndex = tasks.findIndex(task => task.id === draggedId);
    const targetIndex = tasks.findIndex(task => task.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removedTask] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, removedTask);

        saveTasks();
        renderTasks();
    }

    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}

// Background animation functions
function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const particleCount = 15; // Number of particles

    // Clear existing particles first
    container.innerHTML = '';

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random size between 5px and 15px
        const size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random starting position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;

        // Random animation duration between 10s and 20s
        const duration = Math.random() * 10 + 10;
        particle.style.setProperty('--animation-duration', `${duration}s`);

        // Random float distance
        const floatX = Math.random() * 100 - 50; // -50px to 50px
        const floatY = Math.random() * 100 - 50; // -50px to 50px
        particle.style.setProperty('--float-x', `${floatX}px`);
        particle.style.setProperty('--float-y', `${floatY}px`);

        // Alternate colors between primary and secondary
        if (i % 3 === 0) {
            particle.style.background = 'var(--secondary-color)';
        } else if (i % 3 === 1) {
            particle.style.background = 'var(--primary-color)';
        } else {
            particle.style.background = 'var(--accent-color)';
        }

        container.appendChild(particle);
    }
}

// Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
    updateProgressBar();
}

// Initialize app
renderTasks();
updateProgressBar();