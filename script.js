class MultiplicationGame {
    constructor() {
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.currentProblem = null;
        this.settings = {
            easy: new Set([1, 2, 5]),
            medium: new Set([3, 4, 6]),
            hard: new Set([7, 8, 9])
        };
        this.setupEventListeners();
        this.initializeDB().then(() => {
            this.loadSettings();
            this.initializeSettings();
        });
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.querySelectorAll('.answer-option').forEach(button => {
            button.addEventListener('click', (e) => this.checkAnswer(e.target));
        });
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('restart-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('exit-btn').addEventListener('click', () => this.exitGame());
    }

    startGame() {
        this.score = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('final-score').textContent = '0';
        document.getElementById('setup-screen').classList.add('d-none');
        document.getElementById('end-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.remove('d-none');
        
        this.startTimer();
        this.generateProblem();
    }

    showStartScreen() {
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('end-screen').classList.add('d-none');
        document.getElementById('setup-screen').classList.remove('d-none');
        
        // Reset progress bar
        const progressBar = document.getElementById('timer-progress');
        progressBar.style.width = '100%';
        document.getElementById('timer').textContent = '60';
    }

    startTimer() {
        const totalTime = 60; // 1 minute in seconds
        let timeLeft = totalTime;
        
        const timerElement = document.getElementById('timer');
        const progressBar = document.getElementById('timer-progress');
        
        // Clear any existing timer
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            // Update progress bar
            const progressPercent = (timeLeft / totalTime) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.endGame();
            }
        }, 1000);
    }

    initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('multiplicationGame', 1);

            request.onerror = () => {
                console.log('Error opening IndexedDB');
                resolve(); // Still resolve so the game can work with defaults
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
        });
    }

    loadSettings() {
        if (!this.db) return;

        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get('difficultySettings');

        request.onsuccess = (event) => {
            const savedSettings = event.target.result;
            if (savedSettings) {
                this.settings = {
                    easy: new Set(savedSettings.easy),
                    medium: new Set(savedSettings.medium),
                    hard: new Set(savedSettings.hard)
                };
            }
            this.createNumberGrids(); // Refresh grids with loaded settings
        };

        request.onerror = () => {
            console.log('Error loading settings from IndexedDB');
        };
    }

    initializeSettings() {
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        this.createNumberGrids();
    }

    createNumberGrids() {
        const difficulties = ['easy', 'medium', 'hard'];
        difficulties.forEach(difficulty => {
            const grid = document.querySelector(`.number-grid[data-difficulty="${difficulty}"]`);
            grid.innerHTML = '';
            
            // Create 9x9 grid
            for (let i = 1; i <= 9; i++) {
                for (let j = 1; j <= 9; j++) {
                    const product = i * j;
                    const cell = document.createElement('div');
                    cell.className = `number-cell ${this.settings[difficulty].has(product) ? 'selected' : ''}`;
                    cell.textContent = product;
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    cell.dataset.product = product;
                    
                    cell.addEventListener('click', () => {
                        cell.classList.toggle('selected');
                    });
                    
                    grid.appendChild(cell);
                }
            }

            // Add row toggle handlers
            const rowToggles = grid.closest('.multiplication-grid-container').querySelectorAll('.row-toggle');
            rowToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const row = toggle.dataset.row;
                    toggle.classList.toggle('selected');
                    const isSelected = toggle.classList.contains('selected');
                    
                    grid.querySelectorAll(`.number-cell[data-row="${row}"]`).forEach(cell => {
                        cell.classList.toggle('selected', isSelected);
                    });
                });
            });

            // Add column toggle handlers
            const colToggles = grid.closest('.multiplication-grid-container').querySelectorAll('.col-toggle');
            colToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const col = toggle.dataset.col;
                    toggle.classList.toggle('selected');
                    const isSelected = toggle.classList.contains('selected');
                    
                    grid.querySelectorAll(`.number-cell[data-col="${col}"]`).forEach(cell => {
                        cell.classList.toggle('selected', isSelected);
                    });
                });
            });
        });
    }

    openSettings() {
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    }

    saveSettings() {
        const difficulties = ['easy', 'medium', 'hard'];
        difficulties.forEach(difficulty => {
            const selectedNumbers = new Set();
            const grid = document.querySelector(`.number-grid[data-difficulty="${difficulty}"]`);
            grid.querySelectorAll('.number-cell.selected').forEach(cell => {
                selectedNumbers.add(parseInt(cell.dataset.product));
            });
            this.settings[difficulty] = selectedNumbers;
        });

        if (this.db) {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const settingsToSave = {
                easy: Array.from(this.settings.easy),
                medium: Array.from(this.settings.medium),
                hard: Array.from(this.settings.hard)
            };
            
            store.put(settingsToSave, 'difficultySettings');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        modal.hide();
    }

    generateProblem() {
        const difficulty = document.getElementById('difficulty').value;
        const selectedProducts = Array.from(this.settings[difficulty]);
        
        if (selectedProducts.length === 0) {
            alert('Please select at least one number in settings for this difficulty level');
            return;
        }

        // Create a map of all possible factor pairs for the selected products
        const factorPairs = [];
        selectedProducts.forEach(product => {
            for (let i = 1; i <= 9; i++) {
                for (let j = 1; j <= 9; j++) {
                    if (i * j === product) {
                        factorPairs.push([i, j]);
                    }
                }
            }
        });

        if (factorPairs.length === 0) {
            alert('No valid factor pairs found for the selected products');
            return;
        }

        // Randomly select a factor pair
        const [num1, num2] = factorPairs[Math.floor(Math.random() * factorPairs.length)];
        const correctAnswer = num1 * num2;
        
        this.currentProblem = {
            num1: num1,
            num2: num2,
            answer: correctAnswer
        };

        document.getElementById('problem').textContent = `${num1} × ${num2} = ?`;
        
        // Generate wrong answers
        let answers = [correctAnswer];
        while (answers.length < 3) {
            // Get random factors from 1-9
            const wrongNum1 = Math.floor(Math.random() * 9) + 1;
            const wrongNum2 = Math.floor(Math.random() * 9) + 1;
            const wrongAnswer = wrongNum1 * wrongNum2;
            
            // Only use wrong answers that are in our selected products
            if (!answers.includes(wrongAnswer) && selectedProducts.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }
        
        // If we couldn't find enough wrong answers from selected products,
        // fill with other products close to the correct answer
        while (answers.length < 3) {
            const offset = Math.floor(Math.random() * 10) - 5; // Random number between -5 and 5
            const wrongAnswer = correctAnswer + offset;
            if (wrongAnswer > 0 && wrongAnswer <= 81 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }
        
        // Shuffle answers
        answers = answers.sort(() => Math.random() - 0.5);
        
        // Set button text
        const buttons = document.querySelectorAll('.answer-option');
        buttons.forEach((button, index) => {
            button.textContent = answers[index];
            button.classList.remove('correct', 'incorrect');
            button.disabled = false;
        });
    }

    checkAnswer(buttonElement) {
        const userAnswer = parseInt(buttonElement.textContent);
        const isCorrect = userAnswer === this.currentProblem.answer;
        
        if (isCorrect) {
            this.score++;
            document.getElementById('score').textContent = this.score;
            buttonElement.classList.add('correct');
        } else {
            buttonElement.classList.add('incorrect');
            // Show correct answer
            document.querySelectorAll('.answer-option').forEach(button => {
                if (parseInt(button.textContent) === this.currentProblem.answer) {
                    button.classList.add('correct');
                }
            });
        }

        // Disable all buttons temporarily
        document.querySelectorAll('.answer-option').forEach(button => {
            button.disabled = true;
        });

        // Wait before showing next problem
        setTimeout(() => {
            // Reset all buttons first
            document.querySelectorAll('.answer-option').forEach(button => {
                button.disabled = false;
                button.classList.remove('correct', 'incorrect');
            });
            
            if (isCorrect) {
                this.generateProblem();
            }
        }, 1000);
    }

    endGame() {
        // Clear the timer
        clearInterval(this.timer);
        
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Hide game screen and show end screen
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('end-screen').classList.remove('d-none');
        
        // Reset progress bar
        const progressBar = document.getElementById('timer-progress');
        progressBar.style.width = '0%';
    }

    exitGame() {
        // Clear the timer
        clearInterval(this.timer);
        
        // Reset progress bar
        const progressBar = document.getElementById('timer-progress');
        progressBar.style.width = '100%';
        document.getElementById('timer').textContent = '60';
        
        // Show start screen
        this.showStartScreen();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
}); 