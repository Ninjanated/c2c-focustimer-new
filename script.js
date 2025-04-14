const display = document.querySelector('.display');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const addTenBtn = document.getElementById('addTenBtn');
const addThirtyBtn = document.getElementById('addThirtyBtn');
const removeTenBtn = document.getElementById('removeTenBtn');
const removeThirtyBtn = document.getElementById('removeThirtyBtn');
const modeIndicator = document.querySelector('.mode-indicator');

// Settings popup elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('settingsPopup');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const workMinutesInput = document.getElementById('workMinutesInput');
const workSecondsInput = document.getElementById('workSecondsInput');
const restMinutesInput = document.getElementById('restMinutesInput');
const restSecondsInput = document.getElementById('restSecondsInput');

// Time's up popup elements
const timeUpPopup = document.getElementById('timeUpPopup');
const popupMessage = document.getElementById('popupMessage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// Get new elements
const pausedIndicator = document.querySelector('.paused-indicator');
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmSettingsBtn = document.getElementById('confirmSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

// Initialize Audio Context
let audioContext;
// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}, { once: true });

let FOCUS_TIME = 25 * 60; // 25 minutes in seconds
let REST_TIME = 5 * 60;  // 5 minutes in seconds

let timeLeft = FOCUS_TIME;
let timerId = null;
let isRunning = false;
let isFocusMode = true;

// Request notification permission early
if ("Notification" in window) {
    Notification.requestPermission();
}

// Settings popup handlers
settingsBtn.addEventListener('click', () => {
    if (isRunning) {
        confirmationDialog.classList.add('show');
    } else {
        openSettings();
    }
});

function openSettings() {
    if (isRunning) {
        pauseTimer();
        pausedIndicator.classList.add('show');
    }
    // Set current values in settings
    workMinutesInput.value = Math.floor(FOCUS_TIME / 60);
    workSecondsInput.value = FOCUS_TIME % 60;
    restMinutesInput.value = Math.floor(REST_TIME / 60);
    restSecondsInput.value = REST_TIME % 60;
    modeIndicator.textContent = isFocusMode ? 'Focus Time' : 'Rest Time';
    settingsPopup.classList.add('show');
}

function closeSettings() {
    // Update durations from settings
    FOCUS_TIME = parseInt(workMinutesInput.value) * 60 + parseInt(workSecondsInput.value);
    REST_TIME = parseInt(restMinutesInput.value) * 60 + parseInt(restSecondsInput.value);
    
    settingsPopup.classList.remove('show');
    if (!isRunning) {
        timeLeft = isFocusMode ? FOCUS_TIME : REST_TIME;
        updateDisplay();
    } else {
        startTimer();
        pausedIndicator.classList.remove('show');
    }
}

// Confirmation dialog handlers
confirmSettingsBtn.addEventListener('click', () => {
    confirmationDialog.classList.remove('show');
    openSettings();
});

cancelSettingsBtn.addEventListener('click', () => {
    confirmationDialog.classList.remove('show');
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    display.textContent = formatTime(timeLeft);
}

function toggleMode() {
    isFocusMode = !isFocusMode;
    timeLeft = isFocusMode ? FOCUS_TIME : REST_TIME;
    modeIndicator.textContent = isFocusMode ? 'Focus Time' : 'Rest Time';
    updateDisplay();
}

function resetToDefault() {
    stopTimer();
    isFocusMode = true;
    modeIndicator.textContent = 'Focus Time';
    timeLeft = FOCUS_TIME;
    updateDisplay();
}

function playNotificationSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    
    // Configure gain (volume)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playNotification() {
    // Play notification sound
    playNotificationSound();

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timer Complete!", {
            body: isFocusMode ? "Time for a break!" : "Back to focus time!",
            icon: "/favicon.ico"
        });
    }
}

function showPopup(message) {
    popupMessage.textContent = message;
    timeUpPopup.classList.add('show');
}

// Close popup when OK button is clicked
popupCloseBtn.addEventListener('click', () => {
    timeUpPopup.classList.remove('show');
});

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startPauseBtn.textContent = 'Pause';
        pausedIndicator.classList.remove('show');
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                stopTimer();
                playNotification();
                const message = isFocusMode ? 
                    "Focus session complete! Time for a break." : 
                    "Break time is over! Ready to focus again?";
                showPopup(message);
                toggleMode();
            }
        }, 1000);
    } else {
        pauseTimer();
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerId);
        isRunning = false;
        startPauseBtn.textContent = 'Start';
        pausedIndicator.classList.add('show');
    }
}

function stopTimer() {
    clearInterval(timerId);
    isRunning = false;
    timerId = null;
}

// Event Listeners
startPauseBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetToDefault);

// Quick adjust button handlers
function addTime(seconds) {
    timeLeft += seconds;
    updateDisplay();
}

function removeTime(seconds) {
    if (timeLeft > seconds) {
        timeLeft -= seconds;
    } else {
        timeLeft = 0;
    }
    updateDisplay();
}

addTenBtn.addEventListener('click', () => addTime(10));
addThirtyBtn.addEventListener('click', () => addTime(30));
removeTenBtn.addEventListener('click', () => removeTime(10));
removeThirtyBtn.addEventListener('click', () => removeTime(30));

// Close popup when clicking outside
timeUpPopup.addEventListener('click', (e) => {
    if (e.target === timeUpPopup) {
        timeUpPopup.classList.remove('show');
    }
});

// Close settings popup when clicking outside
settingsPopup.addEventListener('click', (e) => {
    if (e.target === settingsPopup) {
        settingsPopup.classList.remove('show');
    }
});

// Update settingsCloseBtn event listener
settingsCloseBtn.addEventListener('click', closeSettings);

// Input validation for all time inputs
[workMinutesInput, workSecondsInput, restMinutesInput, restSecondsInput].forEach(input => {
    input.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
        if (this.value > 59) this.value = 59;
    });
});

// Initialize display
updateDisplay();
