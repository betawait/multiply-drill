class MultiplicationGame {
    constructor() {
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.currentProblem = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.querySelectorAll('.answer-option').forEach(button => {
            button.addEventListener('click', (e) => this.checkAnswer(e.target));
        });
    }

    startGame() {
        this.score = 0;
        this.timer = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('setup-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.remove('d-none');
        
        this.startTimer();
        this.generateProblem();
    }

    startTimer() {
        const totalTime = 60; // 1 minute in seconds
        let timeLeft = totalTime;
        
        const timerElement = document.getElementById('timer');
        const progressBar = document.getElementById('timer-progress');
        
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

    generateProblem() {
        const difficulty = document.getElementById('difficulty').value;
        const difficultyNumbers = {
            'easy': [1, 2, 5],
            'medium': [3, 6],
            'hard': [7, 8, 9]
        };
        const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // Get one number from the difficulty set
        const currentNumbers = difficultyNumbers[difficulty];
        const num1 = currentNumbers[Math.floor(Math.random() * currentNumbers.length)];
        
        // Get the other number from all possible numbers
        const num2 = allNumbers[Math.floor(Math.random() * allNumbers.length)];
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
            // Get one number from difficulty set and one from all numbers
            const wrongNum1 = currentNumbers[Math.floor(Math.random() * currentNumbers.length)];
            const wrongNum2 = allNumbers[Math.floor(Math.random() * allNumbers.length)];
            const wrongAnswer = wrongNum1 * wrongNum2;
            if (!answers.includes(wrongAnswer)) {
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
        // ... existing end game code ...
        const progressBar = document.getElementById('timer-progress');
        progressBar.style.width = '0%';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
}); 