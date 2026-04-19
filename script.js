/**
 * Task Allocation System - Vanilla JavaScript Logic
 */

// ==========================================
// State Management
// ==========================================
// Load tasks from localStorage or initialize empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingTaskId = null;

// ==========================================
// DOM Elements Selection
// ==========================================
const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const assigneeInput = document.getElementById('assignee');
const deadlineInput = document.getElementById('deadline');

const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

const taskListContainer = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const totalTasksSpan = document.getElementById('total-tasks');
const completedTasksSpan = document.getElementById('completed-tasks');

// ==========================================
// Initialization
// ==========================================
// Set minimum date for deadline to today
const today = new Date().toISOString().split('T')[0];
deadlineInput.setAttribute('min', today);

// Render initial tasks
renderTasks();

// ==========================================
// Event Listeners
// ==========================================
form.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', resetForm);

// ==========================================
// Core Functions
// ==========================================

/**
 * Handles form submission for both Adding and Editing tasks
 */
function handleFormSubmit(e) {
    e.preventDefault(); // Prevent page reload

    // Get values from inputs
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const assignee = assigneeInput.value.trim();
    const deadline = deadlineInput.value;

    if (!title || !description || !assignee || !deadline) {
        alert('Please fill in all fields');
        return;
    }

    if (editingTaskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                assignee,
                deadline
            };
        }
    } else {
        // Create new task object
        const newTask = {
            id: Date.now().toString(), // Simple unique ID
            title,
            description,
            assignee,
            deadline,
            status: 'Pending', // Default status
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveAndRender();
    resetForm();
}

/**
 * Deletes a task by ID
 */
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        
        // If we delete the task we are currently editing, reset the form
        if (editingTaskId === id) {
            resetForm();
        }
        
        saveAndRender();
    }
}

/**
 * Toggles task status between Pending and Completed
 */
function toggleStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = task.status === 'Pending' ? 'Completed' : 'Pending';
        saveAndRender();
    }
}

/**
 * Prepares the form for editing an existing task
 */
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Populate form fields
    titleInput.value = task.title;
    descInput.value = task.description;
    assigneeInput.value = task.assignee;
    deadlineInput.value = task.deadline;

    // Update UI state for editing
    editingTaskId = id;
    formTitle.textContent = 'Edit Task';
    submitBtn.textContent = 'Update Task';
    cancelBtn.classList.remove('hidden');
    
    // Scroll to form smoothly (helpful on mobile)
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Resets the form to its default 'Add' state
 */
function resetForm() {
    form.reset();
    editingTaskId = null;
    formTitle.textContent = 'Add New Task';
    submitBtn.textContent = 'Add Task';
    cancelBtn.classList.add('hidden');
}

/**
 * Saves tasks to localStorage and updates the UI
 */
function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

/**
 * Renders the tasks array into the DOM
 */
function renderTasks() {
    // Clear current list
    taskListContainer.innerHTML = '';

    // Update stats
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    totalTasksSpan.textContent = `Total: ${tasks.length}`;
    completedTasksSpan.textContent = `Completed: ${completedCount}`;

    // Show/hide empty state
    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // Sort tasks: Pending first, then by deadline
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'Pending' ? -1 : 1;
        }
        return new Date(a.deadline) - new Date(b.deadline);
    });

    // Create and append task cards
    sortedTasks.forEach(task => {
        const isCompleted = task.status === 'Completed';
        
        // Format date nicely
        const dateObj = new Date(task.deadline);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        // Create card element
        const card = document.createElement('div');
        card.className = `task-card ${isCompleted ? 'completed' : ''}`;
        
        // Build inner HTML safely
        card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${escapeHTML(task.title)}</h3>
                <span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span>
            </div>
            
            <p class="task-desc">${escapeHTML(task.description)}</p>
            
            <div class="task-meta">
                <div class="meta-item">
                    <span class="meta-label">Assignee:</span> 
                    <span>${escapeHTML(task.assignee)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Deadline:</span> 
                    <span style="color: ${isPastDeadline(task.deadline) && !isCompleted ? 'var(--danger-color)' : 'inherit'}">
                        ${formattedDate}
                    </span>
                </div>
            </div>
            
            <div class="task-actions">
                <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-success'}" onclick="window.toggleStatus('${task.id}')">
                    ${isCompleted ? 'Mark Pending' : 'Complete'}
                </button>
                <button class="btn btn-secondary" onclick="window.editTask('${task.id}')">Edit</button>
                <button class="btn btn-danger" onclick="window.deleteTask('${task.id}')">Delete</button>
            </div>
        `;

        taskListContainer.appendChild(card);
    });
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Simple HTML escaper to prevent XSS from user input
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Checks if a date string is in the past
 */
function isPastDeadline(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(dateString);
    return deadlineDate < today;
}

// Expose functions to window object so inline onclick handlers can access them
window.deleteTask = deleteTask;
window.toggleStatus = toggleStatus;
window.editTask = editTask;
