
// Display current date
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

// Initialize data storage
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || { time: 150, calories: 2000 };

let activityChart, pieChart;

// Set today's date as default
document.getElementById('workoutDate').valueAsDate = new Date();
document.getElementById('timeGoal').value = goals.time;
document.getElementById('calorieGoal').value = goals.calories;

// Initialize dashboard
function init() {
    updateStats();
    updateGoalProgress();
    renderWorkoutLog();
    createCharts();
}

// Handle form submission
document.getElementById('exerciseForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const workout = {
        id: Date.now(),
        type: document.getElementById('exerciseType').value,
        duration: parseInt(document.getElementById('duration').value),
        calories: parseInt(document.getElementById('calories').value),
        date: document.getElementById('workoutDate').value
    };

    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));

    this.reset();
    document.getElementById('workoutDate').valueAsDate = new Date();

    // Show success feedback
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Saved!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);

    init();
});

// Update goals
document.getElementById('updateGoals').addEventListener('click', function () {
    goals.time = parseInt(document.getElementById('timeGoal').value);
    goals.calories = parseInt(document.getElementById('calorieGoal').value);
    localStorage.setItem('goals', JSON.stringify(goals));

    // Show feedback
    const originalHTML = this.innerHTML;
    this.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        this.innerHTML = originalHTML;
    }, 1500);

    updateGoalProgress();
});

// Update statistics
function updateStats() {
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const totalTime = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalWorkouts = workouts.length;
    const streak = calculateStreak();

    document.getElementById('totalCalories').textContent = totalCalories.toLocaleString();
    document.getElementById('totalTime').textContent = totalTime.toLocaleString();
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('currentStreak').textContent = streak;
}

// Calculate workout streak
function calculateStreak() {
    if (workouts.length === 0) return 0;

    const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (let date of dates) {
        const workoutDate = new Date(date);
        const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === streak) {
            streak++;
        } else if (daysDiff > streak) {
            break;
        }
    }

    return streak;
}

// Update goal progress
function updateGoalProgress() {
    const weekStart = getWeekStart();
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);

    const weeklyTime = weekWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const weeklyCalories = weekWorkouts.reduce((sum, w) => sum + w.calories, 0);

    const timePercent = Math.min(100, (weeklyTime / goals.time) * 100);
    const caloriePercent = Math.min(100, (weeklyCalories / goals.calories) * 100);

    document.getElementById('weeklyTimeText').textContent = `${weeklyTime} / ${goals.time} minutes`;
    document.getElementById('weeklyTimePercent').textContent = `${Math.round(timePercent)}%`;
    document.getElementById('timeProgress').style.width = `${timePercent}%`;

    document.getElementById('weeklyCalorieText').textContent = `${weeklyCalories} / ${goals.calories} calories`;
    document.getElementById('weeklyCaloriePercent').textContent = `${Math.round(caloriePercent)}%`;
    document.getElementById('calorieProgress').style.width = `${caloriePercent}%`;
}

// Get start of current week
function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
}

// Render workout log
function renderWorkoutLog() {
    const log = document.getElementById('exerciseLog');

    if (workouts.length === 0) {
        log.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No workouts logged yet. Start tracking your fitness journey!</p>
                    </div>
                `;
        return;
    }

    const recentWorkouts = workouts.slice(-10).reverse();
    log.innerHTML = recentWorkouts.map(w => `
                <div class="log-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div style="flex: 1;">
                            <strong>${w.type}</strong><br>
                            <small><i class="fas fa-clock"></i> ${w.duration} min</small>
                            <small class="ms-2"><i class="fas fa-fire"></i> ${w.calories} cal</small><br>
                            <small class="text-muted"><i class="far fa-calendar"></i> ${new Date(w.date).toLocaleDateString()}</small>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteWorkout(${w.id})" title="Delete workout">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `).join('');
}

// Delete workout
function deleteWorkout(id) {
    if (confirm('Are you sure you want to delete this workout?')) {
        workouts = workouts.filter(w => w.id !== id);
        localStorage.setItem('workouts', JSON.stringify(workouts));
        init();
    }
}

// Create charts
function createCharts() {
    // Activity line chart (last 7 days)
    const last7Days = getLast7Days();
    const activityData = last7Days.map(date => {
        return workouts
            .filter(w => w.date === date)
            .reduce((sum, w) => sum + w.duration, 0);
    });

    if (activityChart) activityChart.destroy();

    const ctx1 = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Workout Minutes',
                data: activityData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Exercise pie chart
    const exerciseTypes = {};
    workouts.forEach(w => {
        exerciseTypes[w.type] = (exerciseTypes[w.type] || 0) + w.duration;
    });

    if (pieChart) pieChart.destroy();

    const ctx2 = document.getElementById('pieChart').getContext('2d');

    if (Object.keys(exerciseTypes).length === 0) {
        ctx2.canvas.parentElement.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-pie"></i>
                        <p>No data available. Log workouts to see distribution.</p>
                    </div>
                `;
        return;
    } else {
        if (!ctx2.canvas.parentElement.querySelector('canvas')) {
            ctx2.canvas.parentElement.innerHTML = '<canvas id="pieChart"></canvas>';
        }
    }

    pieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(exerciseTypes),
            datasets: [{
                data: Object.values(exerciseTypes),
                backgroundColor: [
                    '#3498db', '#e74c3c', '#27ae60', '#f39c12',
                    '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: { size: 12 },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed + ' min';
                        }
                    }
                }
            }
        }
    });
}

// Get last 7 days
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

// Export to CSV
document.getElementById('exportBtn').addEventListener('click', function () {
    if (workouts.length === 0) {
        alert('No workouts to export!');
        return;
    }

    let csv = 'Date,Exercise Type,Duration (min),Calories\n';
    workouts.forEach(w => {
        csv += `${w.date},${w.type},${w.duration},${w.calories}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// Initialize on load
init();
