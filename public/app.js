document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const todoSection = document.getElementById('todo-section');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task');
    const newCategorySelect = document.getElementById('new-category');
    const taskList = document.getElementById('task-list');
    const userNameSpan = document.getElementById('user-name');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const errorDisplay = document.createElement('p');
    errorDisplay.className = 'error';

    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');

    if (token) {
        showTodoSection();
        fetchTasks(); // Fetch tasks after showing the todo section
    } else {
        showAuthSection();
    }

    function showAuthSection() {
        authSection.classList.remove('hidden');
        todoSection.classList.add('hidden');
    }

    function showTodoSection() {
        authSection.classList.add('hidden');
        todoSection.classList.remove('hidden');
        userNameSpan.textContent = username || "User";
    }

    // Toggle to the registration form
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // Toggle to the login form
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Function to fetch tasks from the server
    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` // Pass the token in the header
                }
            });

            console.log('Response status:', res.status);
            console.log('Response content type:', res.headers.get('content-type'));

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const tasks = await res.json();
                console.log('Fetched tasks:', tasks);
                displayTasks(tasks);
            } else {
                const text = await res.text();
                console.error('Unexpected response:', text);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    // Function to display tasks on the page
    function displayTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            taskItem.innerHTML = `
                <span>${task.completed ? '<s>' + task.title + '</s>' : task.title} [${task.category}]</span>
                <div>
                    <button class="complete-btn" data-id="${task._id}">${task.completed ? 'Undo' : 'Complete'}</button>
                    <button class="delete-btn" data-id="${task._id}">Delete</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    // Registration Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const regUsername = document.getElementById('register-username').value;
        const regPassword = document.getElementById('register-password').value;

        if (!regUsername || !regPassword) {
            alert('Please fill in both username and password');
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUsername, password: regPassword })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', regUsername);
                token = data.token;
                username = regUsername;
                showTodoSection();
                fetchTasks();
            } else {
                alert(data.msg || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const logUsername = document.getElementById('login-username').value;
        const logPassword = document.getElementById('login-password').value;

        if (!logUsername || !logPassword) {
            alert('Please enter both username and password');
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: logUsername, password: logPassword })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', logUsername);
                token = data.token;
                username = logUsername;
                showTodoSection();
                fetchTasks();
            } else {
                alert(data.msg || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Logout Button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        token = null;
        username = null;
        showAuthSection();
    });

    // Add Task Button
    addTaskBtn.addEventListener('click', async () => {
        const title = newTaskInput.value.trim();
        const category = newCategorySelect.value;

        if (!title) {
            alert('Please enter a task title.');
            return;
        }

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, category })
            });
            if (res.ok) {
                fetchTasks();
                newTaskInput.value = ''; // Clear input after task is added
            } else {
                alert('Error adding task.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Task List Button Click (Complete or Delete)
    taskList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('complete-btn')) {
            const taskId = e.target.getAttribute('data-id');
            const isCompleted = e.target.textContent === 'Complete';

            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ completed: isCompleted })
                });
                if (res.ok) {
                    fetchTasks();
                } else {
                    alert('Error updating task.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        if (e.target.classList.contains('delete-btn')) {
            const taskId = e.target.getAttribute('data-id');
            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchTasks();
                } else {
                    alert('Error deleting task.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
});
