// DOM Elements
const roundTimeInput = document.getElementById('roundTime');
const restTimeInput = document.getElementById('restTime');
const totalRoundsInput = document.getElementById('totalRounds');

const timerCard = document.getElementById('timerCard');
const statusBadge = document.getElementById('statusBadge');
const roundIndicator = document.getElementById('roundIndicator');
const timerDisplay = document.getElementById('timerDisplay');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const historyList = document.getElementById('historyList');
const clearLogBtn = document.getElementById('clearLogBtn');

// App State
let roundTime = parseInt(roundTimeInput.value);
let restTime = parseInt(restTimeInput.value);
let totalRounds = parseInt(totalRoundsInput.value);

let currentRound = 1;
let timeRemaining = roundTime;
let mode = 'IDLE'; // 'IDLE' | 'FIGHT' | 'REST' | 'PAUSED'
let previousMode = 'FIGHT';
let timerInterval = null;

// NEW: Speech Synthesis (Text-to-Speech) Function
function speak(text) {
  // Eğer tarayıcı konuşmayı desteklemiyorsa fonksiyondan çık
  if (!('speechSynthesis' in window)) return;

  // Devam eden konuşma varsa iptal et (üst üste binmesinler)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // İngilizce konuşma dili
  utterance.pitch = 1;      // Ses tonu (0.1 - 2 arası)
  utterance.rate = 1;       // Konuşma hızı (0.1 - 10 arası)
  
  // Konuşmayı başlat
  window.speechSynthesis.speak(utterance);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
  roundIndicator.textContent = `Round ${currentRound} / ${totalRounds}`;
}

function setCardMode(newMode) {
  timerCard.className = 'card timer-card ' + newMode.toLowerCase();
  statusBadge.textContent = newMode;
}

function startTimer() {
  if (mode === 'IDLE') {
    roundTime = parseInt(roundTimeInput.value) || 180;
    restTime = parseInt(restTimeInput.value) || 60;
    totalRounds = parseInt(totalRoundsInput.value) || 5;
    
    currentRound = 1;
    timeRemaining = roundTime;
    mode = 'FIGHT';
    setCardMode('FIGHT');
    
    // NEW: Speak "FIGHT" when starting from IDLE
    speak('FIGHT'); 
  } else if (mode === 'PAUSED') {
    mode = previousMode;
    setCardMode(mode);
    
    // NEW: Speak current mode when resuming
    speak(mode);
  }

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  disableInputs(true);

  // Zaten çalışıyorsa tekrar Interval başlatma
  if (!timerInterval) {
    timerInterval = setInterval(tick, 1000);
  }
}

function tick() {
  timeRemaining--;
  updateDisplay();

  if (timeRemaining <= 0) {
    if (mode === 'FIGHT') {
      if (currentRound >= totalRounds) {
        completeWorkout();
        return;
      }
      mode = 'REST';
      timeRemaining = restTime;
      setCardMode('REST');
      
      // NEW: Speak "REST" at the end of a FIGHT round
      speak('REST');
    } else if (mode === 'REST') {
      currentRound++;
      mode = 'FIGHT';
      timeRemaining = roundTime;
      setCardMode('FIGHT');
      
      // NEW: Speak "FIGHT" after REST period
      speak('FIGHT');
    }
  }
}

function pauseTimer() {
  if (mode === 'FIGHT' || mode === 'REST') {
    previousMode = mode;
    mode = 'PAUSED';
    clearInterval(timerInterval);
    timerInterval = null; // Interval referansını temizle
    setCardMode('PAUSED');
    startBtn.disabled = false;
    startBtn.textContent = 'Resume';
    pauseBtn.disabled = true;
    
    // NEW: Optionally speak "PAUSED" or nothing
    speak('PAUSED');
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  mode = 'IDLE';
  currentRound = 1;
  timeRemaining = parseInt(roundTimeInput.value) || 180;
  setCardMode('IDLE');
  updateDisplay();

  startBtn.disabled = false;
  startBtn.textContent = 'Start Workout';
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  disableInputs(false);
  
  // NEW: Speak "READY" when resetting
  speak('READY');
}

function completeWorkout() {
  clearInterval(timerInterval);
  timerInterval = null;
  
  // NEW: Speak workout completed
  speak('WORKOUT COMPLETED');
  
  setTimeout(() => {
    alert('🔥 Workout Completed! Great job!');
  }, 100);
  
  saveWorkoutLog();
  resetTimer();
}

function disableInputs(disabled) {
  roundTimeInput.disabled = disabled;
  restTimeInput.disabled = disabled;
  totalRoundsInput.disabled = disabled;
}

// LocalStorage Logic
function saveWorkoutLog() {
  const logs = JSON.parse(localStorage.getItem('matchpoint_logs') || '[]');
  const newLog = {
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    rounds: totalRounds,
    duration: Math.round((totalRounds * roundTime + (totalRounds - 1) * restTime) / 60)
  };
  logs.unshift(newLog);
  localStorage.setItem('matchpoint_logs', JSON.stringify(logs.slice(0, 10)));
  renderHistory();
}

function renderHistory() {
  const logs = JSON.parse(localStorage.getItem('matchpoint_logs') || '[]');
  if (logs.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No recorded sessions yet. Finish a workout to log your stats!</p>';
    return;
  }

  historyList.innerHTML = logs.map(log => `
    <div class="history-item">
      <span><strong>${log.rounds} Rounds</strong> (${log.duration} mins)</span>
      <span style="color: var(--text-muted);">${log.date}</span>
    </div>
  `).join('');
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
clearLogBtn.addEventListener('click', () => {
  localStorage.removeItem('matchpoint_logs');
  renderHistory();
});

// Initial Render
renderHistory();
updateDisplay();