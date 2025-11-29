


// ========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, update, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// 🔥 Firebase Config - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCppa0TcwVGWvoQVOmWRlcq4YMTwx2wexY",
    authDomain: "daily-task-597d9.firebaseapp.com",
    projectId: "daily-task-597d9",
    storageBucket: "daily-task-597d9.firebasestorage.app",
    messagingSenderId: "83531624526",
    appId: "1:83531624526:web:61cc25b4128ab297ff131f"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========================================
// GLOBAL STATE
// ========================================
let currentHabits = [];
let currentFilter = 'all';
let editingHabitId = null;
let selectedIcon = 'fa-fire';
let allDaysData = {};

// ========================================
// DEFAULT HABITS
// ========================================
const defaultHabits = [
    {
        id: generateId(),
        name: 'Wake up at 5 AM',
        description: 'Start the day early and fresh',
        icon: 'fa-sun',
        category: 'productivity',
        completed: false,
        createdAt: Date.now()
    },
    {
        id: generateId(),
        name: 'Gym Workout',
        description: '1 hour strength training',
        icon: 'fa-dumbbell',
        category: 'health',
        completed: false,
        createdAt: Date.now()
    },
    {
        id: generateId(),
        name: 'Coding Practice',
        description: 'Learn and build projects',
        icon: 'fa-code',
        category: 'learning',
        completed: false,
        createdAt: Date.now()
    },
    {
        id: generateId(),
        name: 'Read 30 Pages',
        description: 'Knowledge is power',
        icon: 'fa-book',
        category: 'learning',
        completed: false,
        createdAt: Date.now()
    },
    {
        id: generateId(),
        name: 'Meditation',
        description: '15 minutes mindfulness',
        icon: 'fa-spa',
        category: 'mindfulness',
        completed: false,
        createdAt: Date.now()
    }
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateId() {
    return 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getWeekDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

async function initializeHabits() {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        if (!snapshot.exists()) {
            await set(habitsRef, defaultHabits);
            console.log('✅ Default habits initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing habits:', error);
        showToast('⚠️ Error connecting to Firebase');
    }
}

function loadHabits() {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    onValue(habitsRef, (snapshot) => {
        const habits = snapshot.val();
        if (habits) {
            currentHabits = Array.isArray(habits) ? habits : Object.values(habits);
            renderHabits();
            updateProgress();
            updateBadges();
        } else {
            currentHabits = [];
            document.getElementById('habitsList').innerHTML = '';
            document.getElementById('emptyState').style.display = 'flex';
        }
    });
}

async function saveHabit(habitData) {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        let habits = snapshot.val() || [];
        
        if (editingHabitId) {
            // Update existing habit
            const index = habits.findIndex(h => h.id === editingHabitId);
            if (index !== -1) {
                habits[index] = { ...habits[index], ...habitData };
            }
        } else {
            // Add new habit
            habits.push({
                id: generateId(),
                ...habitData,
                completed: false,
                createdAt: Date.now()
            });
        }
        
        await set(habitsRef, habits);
        showToast(editingHabitId ? '✅ Habit updated!' : '✅ Habit added!');
        closeHabitModal();
    } catch (error) {
        console.error('❌ Error saving habit:', error);
        showToast('⚠️ Error saving habit');
    }
}

async function updateHabitStatus(habitId, completed) {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        let habits = snapshot.val() || [];
        
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index].completed = completed;
            await set(habitsRef, habits);
        }
    } catch (error) {
        console.error('❌ Error updating habit:', error);
    }
}

async function deleteHabit(habitId) {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        let habits = snapshot.val() || [];
        
        habits = habits.filter(h => h.id !== habitId);
        
        await set(habitsRef, habits);
        showToast('🗑️ Habit deleted');
    } catch (error) {
        console.error('❌ Error deleting habit:', error);
        showToast('⚠️ Error deleting habit');
    }
}

async function clearCompletedHabits() {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        let habits = snapshot.val() || [];
        
        habits = habits.filter(h => !h.completed);
        
        await set(habitsRef, habits);
        showToast('✅ Completed habits cleared');
    } catch (error) {
        console.error('❌ Error clearing habits:', error);
        showToast('⚠️ Error clearing habits');
    }
}

async function resetTodayHabits() {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        const snapshot = await get(habitsRef);
        let habits = snapshot.val() || [];
        
        habits = habits.map(h => ({ ...h, completed: false }));
        
        await set(habitsRef, habits);
        showToast('🔄 Today\'s habits reset');
    } catch (error) {
        console.error('❌ Error resetting habits:', error);
        showToast('⚠️ Error resetting habits');
    }
}

async function clearAllHabits() {
    const today = getTodayDate();
    const habitsRef = ref(database, `habits/${today}`);
    
    try {
        await set(habitsRef, []);
        showToast('🗑️ All habits cleared');
    } catch (error) {
        console.error('❌ Error clearing all habits:', error);
        showToast('⚠️ Error clearing habits');
    }
}

async function loadAllDaysData() {
    const habitsRef = ref(database, 'habits');
    
    try {
        const snapshot = await get(habitsRef);
        if (snapshot.exists()) {
            allDaysData = snapshot.val();
        }
    } catch (error) {
        console.error('❌ Error loading history:', error);
    }
}

// ========================================
// UI RENDERING
// ========================================

function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    const emptyState = document.getElementById('emptyState');
    
    let habitsToShow = [...currentHabits];
    
    // Apply search filter
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    if (searchQuery) {
        habitsToShow = habitsToShow.filter(h => 
            h.name.toLowerCase().includes(searchQuery) || 
            h.description.toLowerCase().includes(searchQuery)
        );
    }
    
    // Apply category filter
    if (currentFilter === 'active') {
        habitsToShow = habitsToShow.filter(h => !h.completed);
    } else if (currentFilter === 'completed') {
        habitsToShow = habitsToShow.filter(h => h.completed);
    }
    
    if (habitsToShow.length === 0) {
        habitsList.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    habitsList.innerHTML = '';
    
    habitsToShow.forEach(habit => {
        const habitElement = createHabitElement(habit);
        habitsList.appendChild(habitElement);
    });
}

function createHabitElement(habit) {
    const div = document.createElement('div');
    div.className = `habit-item ${habit.completed ? 'completed' : ''}`;
    div.setAttribute('data-habit-id', habit.id);
    
    const categoryEmojis = {
        health: '🏃',
        productivity: '💼',
        learning: '📚',
        mindfulness: '🧘',
        personal: '⭐'
    };
    
    div.innerHTML = `
        <label class="habit-checkbox">
            <input type="checkbox" ${habit.completed ? 'checked' : ''} 
                   onchange="handleHabitToggle('${habit.id}', this.checked)">
            <span class="checkmark"></span>
        </label>
        <div class="habit-content">
            <div class="habit-name">${habit.name}</div>
            <div class="habit-description">${habit.description}</div>
            <span class="habit-category">${categoryEmojis[habit.category]} ${habit.category}</span>
        </div>
        <i class="fas ${habit.icon} habit-icon"></i>
        <div class="habit-actions">
            <button class="habit-action-btn" onclick="editHabit('${habit.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="habit-action-btn delete" onclick="confirmDeleteHabit('${habit.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function updateProgress() {
    const total = currentHabits.length;
    const completed = currentHabits.filter(h => h.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
    
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${percentage}%`;
    
    // Update stats
    updateStatistics();
}

function updateBadges() {
    const total = currentHabits.length;
    const completed = currentHabits.filter(h => h.completed).length;
    const active = total - completed;
    
    document.getElementById('badgeAll').textContent = total;
    document.getElementById('badgeActive').textContent = active;
    document.getElementById('badgeCompleted').textContent = completed;
}

async function updateStatistics() {
    await loadAllDaysData();
    
    // Calculate streak
    const streak = calculateStreak();
    document.getElementById('currentStreak').textContent = streak;
    
    // Calculate week average
    const weekAvg = calculateWeekAverage();
    document.getElementById('weekAverage').textContent = `${weekAvg}%`;
    
    // Total completed (all time)
    const totalCompleted = calculateTotalCompleted();
    document.getElementById('totalCompleted').textContent = totalCompleted;
}

function calculateStreak() {
    const dates = Object.keys(allDaysData).sort().reverse();
    let streak = 0;
    
    for (let date of dates) {
        const dayHabits = Object.values(allDaysData[date]);
        if (dayHabits.length === 0) break;
        
        const completed = dayHabits.filter(h => h.completed).length;
        const total = dayHabits.length;
        
        if (completed === total && total > 0) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function calculateWeekAverage() {
    const weekDates = getWeekDates();
    let totalPercentage = 0;
    let daysWithData = 0;
    
    weekDates.forEach(date => {
        if (allDaysData[date]) {
            const dayHabits = Object.values(allDaysData[date]);
            const completed = dayHabits.filter(h => h.completed).length;
            const total = dayHabits.length;
            
            if (total > 0) {
                totalPercentage += (completed / total) * 100;
                daysWithData++;
            }
        }
    });
    
    return daysWithData > 0 ? Math.round(totalPercentage / daysWithData) : 0;
}

function calculateTotalCompleted() {
    let total = 0;
    
    Object.values(allDaysData).forEach(day => {
        const dayHabits = Object.values(day);
        total += dayHabits.filter(h => h.completed).length;
    });
    
    return total;
}

// ========================================
// WEEKLY CALENDAR
// ========================================

async function renderWeekCalendar() {
    await loadAllDaysData();
    const weekCalendar = document.getElementById('weekCalendar');
    const weekDates = getWeekDates();
    const today = getTodayDate();
    
    weekCalendar.innerHTML = '';
    
    weekDates.forEach(date => {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-box';
        
        if (date === today) {
            dayBox.classList.add('today');
        }
        
        // Check if all habits completed on this day
        if (allDaysData[date]) {
            const dayHabits = Object.values(allDaysData[date]);
            const completed = dayHabits.filter(h => h.completed).length;
            const total = dayHabits.length;
            
            if (completed === total && total > 0) {
                dayBox.classList.add('completed');
            }
        }
        
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = dateObj.getDate();
        
        dayBox.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-number">${dayNumber}</div>
        `;
        
        weekCalendar.appendChild(dayBox);
    });
}

// ========================================
// MODAL MANAGEMENT
// ========================================

function openHabitModal() {
    const modal = document.getElementById('habitModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (editingHabitId) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Habit';
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Habit';
        document.getElementById('habitForm').reset();
        selectedIcon = 'fa-fire';
        updateIconSelection();
    }
    
    modal.classList.add('active');
}

function closeHabitModal() {
    document.getElementById('habitModal').classList.remove('active');
    document.getElementById('habitForm').reset();
    editingHabitId = null;
    selectedIcon = 'fa-fire';
    updateIconSelection();
}

function openAnalyticsModal() {
    document.getElementById('analyticsModal').classList.add('active');
    renderAnalytics();
}

function closeAnalyticsModal() {
    document.getElementById('analyticsModal').classList.remove('active');
}

function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function openConfirmModal(message, callback) {
    const modal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    confirmMessage.textContent = message;
    
    confirmBtn.onclick = () => {
        callback();
        closeConfirmModal();
    };
    
    modal.classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// ========================================
// HABIT ACTIONS
// ========================================

window.handleHabitToggle = function(habitId, checked) {
    updateHabitStatus(habitId, checked);
    
    if (checked) {
        triggerConfetti();
        playCheckSound();
        showToast('🎉 Great job!');
    }
};

window.editHabit = function(habitId) {
    const habit = currentHabits.find(h => h.id === habitId);
    if (!habit) return;
    
    editingHabitId = habitId;
    selectedIcon = habit.icon;
    
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitDescription').value = habit.description;
    document.getElementById('habitCategory').value = habit.category;
    
    updateIconSelection();
    openHabitModal();
};

window.confirmDeleteHabit = function(habitId) {
    openConfirmModal(
        'Are you sure you want to delete this habit?',
        () => deleteHabit(habitId)
    );
};

window.confirmClearCompleted = function() {
    openConfirmModal(
        'Clear all completed habits?',
        () => clearCompletedHabits()
    );
};

window.confirmResetToday = function() {
    openConfirmModal(
        'Reset all habits for today? This will uncheck all completed habits.',
        () => resetTodayHabits()
    );
};

window.confirmClearAllHabits = function() {
    openConfirmModal(
        '⚠️ This will delete ALL habits permanently. Are you sure?',
        () => clearAllHabits()
    );
};

// ========================================
// ANALYTICS
// ========================================

async function renderAnalytics() {
    await loadAllDaysData();
    
    // Calculate analytics stats
    const totalDays = Object.keys(allDaysData).length;
    const avgCompletion = calculateWeekAverage();
    const bestStreak = calculateBestStreak();
    
    document.getElementById('analyticsTotal').textContent = totalDays;
    document.getElementById('analyticsAverage').textContent = `${avgCompletion}%`;
    document.getElementById('analyticsBestStreak').textContent = bestStreak;
    
    // Render chart
    renderProgressChart();
    
    // Render habit performance
    renderHabitPerformance();
}

function calculateBestStreak() {
    const dates = Object.keys(allDaysData).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    
    dates.forEach(date => {
        const dayHabits = Object.values(allDaysData[date]);
        const completed = dayHabits.filter(h => h.completed).length;
        const total = dayHabits.length;
        
        if (completed === total && total > 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    });
    
    return maxStreak;
}

function renderProgressChart() {
    const weekDates = getWeekDates();
    const labels = weekDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });
    
    const data = weekDates.map(date => {
        if (!allDaysData[date]) return 0;
        
        const dayHabits = Object.values(allDaysData[date]);
        const completed = dayHabits.filter(h => h.completed).length;
        const total = dayHabits.length;
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Destroy existing chart if any
    if (window.habitChart) {
        window.habitChart.destroy();
    }
    
    window.habitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion %',
                data: data,
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#b0b0b0',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        }
    });
}

function renderHabitPerformance() {
    const habitPerformanceList = document.getElementById('habitPerformanceList');
    
    // Aggregate habit performance across all days
    const habitStats = {};
    
    Object.values(allDaysData).forEach(day => {
        Object.values(day).forEach(habit => {
            if (!habitStats[habit.name]) {
                habitStats[habit.name] = { total: 0, completed: 0 };
            }
            habitStats[habit.name].total++;
            if (habit.completed) {
                habitStats[habit.name].completed++;
            }
        });
    });
    
    habitPerformanceList.innerHTML = '';
    
    Object.entries(habitStats)
        .sort((a, b) => (b[1].completed / b[1].total) - (a[1].completed / a[1].total))
        .slice(0, 5)
        .forEach(([name, stats]) => {
            const percentage = Math.round((stats.completed / stats.total) * 100);
            
            const item = document.createElement('div');
            item.className = 'performance-item';
            item.innerHTML = `
                <div>
                    <strong>${name}</strong>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <span style="color: var(--neon-cyan); font-weight: 600;">${percentage}%</span>
            `;
            
            habitPerformanceList.appendChild(item);
        });
}

// ========================================
// DATA EXPORT
// ========================================

window.exportData = async function() {
    await loadAllDaysData();
    
    const dataStr = JSON.stringify(allDaysData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-${getTodayDate()}.json`;
    link.click();
    
    showToast('📥 Data exported successfully!');
};

// ========================================
// ANIMATIONS & EFFECTS
// ========================================

function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#00f0ff', '#b800ff', '#ff006e', '#0066ff', '#00ff88'];
    
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -20,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 6 - 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let activeParticles = 0;
        particles.forEach(p => {
            if (p.y < canvas.height + 20) {
                activeParticles++;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
                
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.15;
            }
        });
        
        if (activeParticles > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

function playCheckSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ========================================
// SEARCH & FILTER
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', () => {
        renderHabits();
    });
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderHabits();
        });
    });
    
    // Icon picker
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            selectedIcon = btn.getAttribute('data-icon');
            updateIconSelection();
        });
    });
    
    // Form submit
    document.getElementById('habitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const habitData = {
            name: document.getElementById('habitName').value,
            description: document.getElementById('habitDescription').value,
            icon: selectedIcon,
            category: document.getElementById('habitCategory').value
        };
        
        saveHabit(habitData);
    });
    
    // Button actions
    document.getElementById('btnAddHabit').addEventListener('click', openHabitModal);
    document.getElementById('btnClearCompleted').addEventListener('click', confirmClearCompleted);
    document.getElementById('btnAnalytics').addEventListener('click', openAnalyticsModal);
    document.getElementById('btnSettings').addEventListener('click', openSettingsModal);
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Display current date
    document.getElementById('currentDate').textContent = formatDate(getTodayDate());
    
    // Initialize app
    initApp();
});

function updateIconSelection() {
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-icon') === selectedIcon) {
            btn.classList.add('active');
        }
    });
}

// ========================================
// INITIALIZATION
// ========================================

async function initApp() {
    await initializeHabits();
    loadHabits();
    renderWeekCalendar();
    
    // Refresh calendar every minute
    setInterval(renderWeekCalendar, 60000);
    
    showToast('🔥 Habit Tracker Ready!');
}

// Global functions for HTML onclick
window.closeHabitModal = closeHabitModal;
window.closeAnalyticsModal = closeAnalyticsModal;
window.closeSettingsModal = closeSettingsModal;
window.closeConfirmModal = closeConfirmModal;
window.confirmClearCompleted = confirmClearCompleted;

console.log('🔥 Habit Tracker Initialized!');