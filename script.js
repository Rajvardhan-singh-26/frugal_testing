// DOM Elements
const questionText = document.getElementById('question-text');
const optionsGrid = document.getElementById('options-grid');
const timerDisplay = document.getElementById('timer-display');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentQNum = document.getElementById('current-q');
const totalQNum = document.getElementById('total-q');

// Configuration
const DEFAULT_API_KEY = "AIzaSyCmJNWSqZvVAg_FZQudX0leVmlvnB4QXJU"; // User provided key

// State
let filteredQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timeSpentPerQuestion = {};
let timerInterval;
let timeLeft = 10;
const TIME_LIMIT = 10;

// Initialize
async function init() {
    if (!questionText) return; // Not on quiz page

    const config = JSON.parse(localStorage.getItem('quizConfig')) || { mode: "standard", category: "General", difficulty: "easy" };

    // AI Mode Integration
    if (config.mode === 'ai') {
        questionText.textContent = `Generating quiz for "${config.topic}"...`;
        optionsGrid.innerHTML = '<div class="spinner"></div>';
        nextBtn.style.display = 'none';
        if (timerDisplay) timerDisplay.parentElement.style.display = 'none';

        filteredQuestions = await generateAIQuiz(config.topic, config.apiKey);

        // Restore UI
        nextBtn.style.display = 'inline-block';
        if (timerDisplay) timerDisplay.parentElement.style.display = 'block';
    } else {
        // Standard Mode
        filteredQuestions = quizData.filter(q =>
            q.category === config.category && q.difficulty === config.difficulty
        );

        if (filteredQuestions.length === 0) {
            alert("No questions found for this selection! Loading all.");
            filteredQuestions = quizData;
        }
    }

    if (totalQNum) totalQNum.textContent = filteredQuestions.length;

    // Initialize tracking
    filteredQuestions.forEach((_, i) => timeSpentPerQuestion[i] = 0);

    loadQuestion();
}

// AI Generator Function
async function generateAIQuiz(topic, apiKey) {
    const keyToUse = apiKey && apiKey.trim() !== "" ? apiKey : DEFAULT_API_KEY;

    // 1. Mock Mode (If absolutely no key available - unlikely given hardcoded default)
    if (!keyToUse) {
        console.log("Using Mock AI Generation");
        await new Promise(r => setTimeout(r, 1500));
        return getMockQuestions(topic);
    }

    // 2. Google Gemini API Call
    try {
        console.log(`Calling Gemini API for topic: ${topic}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`;

        const prompt = `Generate 5 multiple choice questions about "${topic}". 
        The output must be a strictly valid JSON array of objects. 
        Each object must have:
        - "question": string
        - "options": array of 4 strings
        - "correct": integer (0-3, index of correct option)
        - "category": string (use "${topic}")
        - "difficulty": "generated"
        Do not include ANY markdown formatting (no backticks). Return ONLY the pure JSON string.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `API Error ${response.status}`);
        }

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;

        // Cleanup Markdown just in case
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const generatedQuestions = JSON.parse(text);
        if (!Array.isArray(generatedQuestions)) throw new Error("Invalid structure");

        return generatedQuestions;

    } catch (error) {
        console.error("AI Generation Failed", error);
        alert(`AI Generation failed: ${error.message}. Switching to Demo Mode.`);
        return getMockQuestions(topic);
    }
}

function getMockQuestions(topic) {
    return [
        { question: `What is a core concept of ${topic}?`, options: ["Concept A", "Concept B", "Concept C", "Concept D"], correct: 0, category: topic, difficulty: "generated" },
        { question: `Who is famous in the field of ${topic}?`, options: ["Person A", "Person B", "Person C", "Person D"], correct: 1, category: topic, difficulty: "generated" },
        { question: `When was ${topic} established?`, options: ["1900s", "Ancient Times", "2020s", "Future"], correct: 0, category: topic, difficulty: "generated" },
        { question: `True or False: ${topic} is complex.`, options: ["True", "False", "Maybe", "Unknown"], correct: 0, category: topic, difficulty: "generated" },
        { question: `What is a common application of ${topic}?`, options: ["Usage X", "Usage Y", "Usage Z", "None"], correct: 0, category: topic, difficulty: "generated" }
    ];
}

function loadQuestion() {
    clearInterval(timerInterval);
    timeLeft = TIME_LIMIT;
    updateTimerUI();
    startTimer();

    const currentQ = filteredQuestions[currentQuestionIndex];
    if (currentQNum) currentQNum.textContent = currentQuestionIndex + 1;

    // Update Progress
    const progress = ((currentQuestionIndex) / filteredQuestions.length) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;

    questionText.textContent = currentQ.question;
    optionsGrid.innerHTML = '';

    currentQ.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option-card';
        div.textContent = option;
        div.dataset.index = index;
        div.setAttribute('data-test', `option-${index}`);

        div.addEventListener('click', () => {
            selectOption(index);
        });

        if (userAnswers[currentQuestionIndex] === index) {
            div.classList.add('selected');
        }

        optionsGrid.appendChild(div);
    });

    nextBtn.textContent = currentQuestionIndex === filteredQuestions.length - 1 ? "Finish" : "Next";
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    const options = document.querySelectorAll('.option-card');
    options.forEach(opt => opt.classList.remove('selected'));
    options[index].classList.add('selected');
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeSpentPerQuestion[currentQuestionIndex] !== undefined) {
            timeSpentPerQuestion[currentQuestionIndex]++;
        }
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleNext();
        }
    }, 1000);
}

function updateTimerUI() {
    if (timerDisplay) timerDisplay.textContent = timeLeft;
}

function handleNext() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    clearInterval(timerInterval);
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const results = filteredQuestions.map((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct;

        return {
            question: q.question,
            isCorrect: userAnswer === q.correct,
            userAnswer: q.options[userAnswer] || "Skipped",
            correctAnswer: q.options[q.correct],
            timeSpent: timeSpentPerQuestion[index] || TIME_LIMIT
        };
    });

    score = results.filter(r => r.isCorrect).length;
    correctCount = score;
    incorrectCount = results.length - score;

    const finalStats = { score, total: filteredQuestions.length, correct: correctCount, incorrect: incorrectCount, details: results };
    localStorage.setItem('quizResults', JSON.stringify(finalStats));
    window.location.href = 'result.html';
}

if (nextBtn) nextBtn.addEventListener('click', handleNext);
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');

init();
