const display = document.querySelector('.display');
const startPauseBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const modeIndicator = document.querySelector('.mode-indicator');

// Settings popup elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('settingsPopup');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');

// Time's up popup elements
const timeUpPopup = document.getElementById('timeUpPopup');
const popupMessage = document.getElementById('popupMessage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// Initialize Audio Context
let audioContext;
// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}, { once: true });

const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
const REST_TIME = 5 * 60;  // 5 minutes in seconds

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
    settingsPopup.classList.add('show');
});

settingsCloseBtn.addEventListener('click', () => {
    settingsPopup.classList.remove('show');
    if (!isRunning) {
        timeLeft = getTimeFromInputs();
        updateDisplay();
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    display.textContent = formatTime(timeLeft);
}

function getTimeFromInputs() {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    return (minutes * 60) + seconds;
}

function toggleMode() {
    isFocusMode = !isFocusMode;
    timeLeft = isFocusMode ? FOCUS_TIME : REST_TIME;
    modeIndicator.textContent = isFocusMode ? 'Focus Time' : 'Rest Time';
    minutesInput.value = isFocusMode ? '25' : '05';
    secondsInput.value = '00';
    updateDisplay();
}

function resetToDefault() {
    stopTimer();
    isFocusMode = true;
    modeIndicator.textContent = 'Focus Time';
    minutesInput.value = "25";
    secondsInput.value = "00";
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
        // If timer wasn't running, get time from inputs
        if (!timerId) {
            timeLeft = getTimeFromInputs();
        }
        
        isRunning = true;
        startPauseBtn.textContent = 'Pause';
        stopBtn.disabled = false;
        
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
    }
}

function stopTimer() {
    clearInterval(timerId);
    isRunning = false;
    timerId = null;
    startPauseBtn.textContent = 'Start';
    stopBtn.disabled = true;
    timeLeft = getTimeFromInputs();
    updateDisplay();
}

// Event Listeners
startPauseBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetToDefault);

// Input validation and time updates
minutesInput.addEventListener('input', function() {
    if (this.value < 0) this.value = 0;
    if (this.value > 59) this.value = 59;
    if (!isRunning) {
        timeLeft = getTimeFromInputs();
        updateDisplay();
    }
});

secondsInput.addEventListener('input', function() {
    if (this.value < 0) this.value = 0;
    if (this.value > 59) this.value = 59;
    if (!isRunning) {
        timeLeft = getTimeFromInputs();
        updateDisplay();
    }
});

// Add change event listeners for when timer is running
minutesInput.addEventListener('change', function() {
    if (isRunning) {
        timeLeft = getTimeFromInputs();
        updateDisplay();
    }
});

secondsInput.addEventListener('change', function() {
    if (isRunning) {
        timeLeft = getTimeFromInputs();
        updateDisplay();
    }
});

// Initialize display
updateDisplay();
