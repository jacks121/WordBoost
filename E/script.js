let wordList = [];
let currentMode = '';
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = [];

// 已学会的单词列表（从 localStorage 加载）
let learnedWords = JSON.parse(localStorage.getItem('learnedWords') || '[]');

// 记录当前题库文件名
let currentBankFile = '';

// 获取 bank 文件夹中的文件列表（硬编码文件列表）
function fetchBankList() {
    const files = ['E1.txt','E2.txt']; // 手动添加你的题库文件名
    displayBankList(files);
}

function displayBankList(files) {
    const bankList = document.getElementById('bank-list');
    bankList.innerHTML = '';
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerText = file;
        li.addEventListener('click', () => selectBank(file));
        bankList.appendChild(li);
    });
}

// 选择题库
function selectBank(filename) {
    currentBankFile = filename;
    fetch(`bank/${filename}`)
        .then(response => response.text())
        .then(content => {
            const fullWordList = parseMarkdownTable(content);
            if (fullWordList.length > 0) {
                // 过滤已学会的单词
                wordList = fullWordList.filter(word => !learnedWords.includes(word.word));
                if (wordList.length === 0) {
                    alert('所有单词都已学会！');
                    return;
                }
                document.getElementById('mode-selection').style.display = 'block';
            } else {
                alert('解析失败，请检查题库格式。');
            }
        })
        .catch(err => {
            console.error(err);
            alert('无法加载题库文件。');
        });
}

// 解析 Markdown 表格
function parseMarkdownTable(markdown) {
    const lines = markdown.trim().split('\n');
    const data = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
            data.push({
                word: cells[0],
                phonetic: cells[1],
                definition: cells[2],
                example: cells[3],
                translation: cells[4]
            });
        }
    }
    return data;
}

// 学习模式选择事件
document.getElementById('mode-en-cn').addEventListener('click', () => startQuiz('en-cn'));
document.getElementById('mode-cn-en').addEventListener('click', () => startQuiz('cn-en'));
document.getElementById('mode-flip').addEventListener('click', () => startQuiz('flip'));

function startQuiz(mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    score = 0;
    wrongAnswers = [];
    document.getElementById('bank-selection').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'block';
    updateTotalQuestions();
    showQuestion();
}

function updateTotalQuestions() {
    document.getElementById('total-questions').innerText = wordList.length;
}

function showQuestion() {
    // 检查是否还有题目
    if (wordList.length === 0) {
        showResult();
        return;
    }

    // 检查是否到达题目列表末尾
    if (currentQuestionIndex >= wordList.length) {
        showResult();
        return;
    }

    document.getElementById('current-question').innerText = currentQuestionIndex + 1;
    document.getElementById('current-score').innerText = score;
    document.getElementById('options').innerHTML = '';
    document.getElementById('next-question').style.display = 'none';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('feedback').innerText = '';

    const currentWord = wordList[currentQuestionIndex];

    // 更新标记按钮状态
    const markBtn = document.getElementById('mark-word');
    if (learnedWords.includes(currentWord.word)) {
        markBtn.innerText = '已学会';
        markBtn.disabled = true;
    } else {
        markBtn.innerText = '标记为已学会';
        markBtn.disabled = false;
    }

    if (currentMode === 'en-cn') {
        // 显示英文单词和例句，选择中文释义
        document.getElementById('question-content').innerHTML = `
            <h3>${currentWord.word} <span class="text-muted">${currentWord.phonetic}</span></h3>
            <p><strong>例句：</strong>${currentWord.example}</p>
        `;
        const options = generateOptions('definition');
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-secondary option-btn';
            btn.innerText = option;
            btn.addEventListener('click', () => checkAnswer(option, currentWord.definition));
            document.getElementById('options').appendChild(btn);
        });
    } else if (currentMode === 'cn-en') {
        // 显示中文释义和例句，选择英文单词
        document.getElementById('question-content').innerHTML = `
            <h3>${currentWord.definition}</h3>
            <p><strong>例句：</strong>${currentWord.example}</p>
        `;
        const options = generateOptions('word');
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-secondary option-btn';
            btn.innerText = option;
            btn.addEventListener('click', () => checkAnswer(option, currentWord.word));
            document.getElementById('options').appendChild(btn);
        });
    } else if (currentMode === 'flip') {
        const contentDiv = document.getElementById('question-content');
        contentDiv.innerHTML = `
            <h3>${currentWord.word} <span class="text-muted">${currentWord.phonetic}</span></h3>
            <p><strong>例句：</strong>${currentWord.example}</p>
        `;
        contentDiv.classList.add('flip');
    
        // 移除之前的事件监听器
        contentDiv.removeEventListener('mousedown', flipContent);
        contentDiv.removeEventListener('mouseup', flipContentBack);
        contentDiv.removeEventListener('touchstart', flipContentTouch);
        contentDiv.removeEventListener('touchend', flipContentBackTouch);
    
        // 添加鼠标事件监听器（桌面设备）
        contentDiv.addEventListener('mousedown', flipContent);
        contentDiv.addEventListener('mouseup', flipContentBack);
    
        // 添加触摸事件监听器（移动设备）
        contentDiv.addEventListener('touchstart', flipContentTouch);
        contentDiv.addEventListener('touchend', flipContentBackTouch);
    
        document.getElementById('next-question').style.display = 'block';
        document.getElementById('next-question').onclick = nextQuestion;
    }
    
    // 新增触摸事件处理函数
    function flipContentTouch(event) {
        event.preventDefault(); // 防止默认的触摸行为
        flipContent();
    }
    
    function flipContentBackTouch(event) {
        event.preventDefault();
        flipContentBack();
    }
    
    // 原有的翻转内容函数
    function flipContent() {
        const currentWord = wordList[currentQuestionIndex];
        const contentDiv = document.getElementById('question-content');
        contentDiv.innerHTML = `
            <h3>${currentWord.definition}</h3>
            <p><strong>例句翻译：</strong>${currentWord.translation}</p>
        `;
    }
    
    function flipContentBack() {
        const currentWord = wordList[currentQuestionIndex];
        const contentDiv = document.getElementById('question-content');
        contentDiv.innerHTML = `
            <h3>${currentWord.word} <span class="text-muted">${currentWord.phonetic}</span></h3>
            <p><strong>例句：</strong>${currentWord.example}</p>
        `;
    }
}

// 翻转内容
function flipContent() {
    const currentWord = wordList[currentQuestionIndex];
    const contentDiv = document.getElementById('question-content');
    contentDiv.innerHTML = `
        <h3>${currentWord.definition}</h3>
        <p><strong>例句翻译：</strong>${currentWord.translation}</p>
    `;
}

// 恢复内容
function flipContentBack() {
    const currentWord = wordList[currentQuestionIndex];
    const contentDiv = document.getElementById('question-content');
    contentDiv.innerHTML = `
        <h3>${currentWord.word} <span class="text-muted">${currentWord.phonetic}</span></h3>
        <p><strong>例句：</strong>${currentWord.example}</p>
    `;
}

function generateOptions(key) {
    const options = [wordList[currentQuestionIndex][key]];
    while (options.length < 4 && wordList.length > 1) {
        const randomOption = wordList[Math.floor(Math.random() * wordList.length)][key];
        if (!options.includes(randomOption)) {
            options.push(randomOption);
        }
    }
    // 如果单词数量不足4个，从 wrongAnswers 中补充选项
    while (options.length < 4) {
        const randomOption = wrongAnswers.length > 0
            ? wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)][key]
            : "没有更多选项";
        if (!options.includes(randomOption)) {
            options.push(randomOption);
        }
    }
    return shuffleArray(options);
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct;
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.style.display = 'block';
    if (isCorrect) {
        score++;
        feedbackDiv.innerHTML = `<span class="correct">✅ 回答正确！</span>`;
    } else {
        feedbackDiv.innerHTML = `<span class="incorrect">❌ 回答错误！正确答案是：${correct}</span>`;
        wrongAnswers.push({
            ...wordList[currentQuestionIndex],
            userAnswer: selected
        });
    }
    // 显示例句翻译
    feedbackDiv.innerHTML += `<div class="mt-2"><strong>例句翻译：</strong>${wordList[currentQuestionIndex].translation}</div>`;

    // 禁用选项按钮
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);

    document.getElementById('next-question').style.display = 'block';
    document.getElementById('next-question').onclick = nextQuestion;
}

function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

// 标记单词为已学会
document.getElementById('mark-word').addEventListener('click', () => {
    const currentWord = wordList[currentQuestionIndex];
    if (!learnedWords.includes(currentWord.word)) {
        learnedWords.push(currentWord.word);
        localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
        alert(`已将 "${currentWord.word}" 标记为已学会。`);

        // 将当前单词从 wordList 中移除
        wordList.splice(currentQuestionIndex, 1);

        // 更新总题数
        updateTotalQuestions();

        // 检查是否还有未学习的单词
        if (wordList.length === 0) {
            alert('所有单词都已学会！');
            showResult();
        } else {
            // 不改变 currentQuestionIndex，继续显示当前索引的题目
            showQuestion();
        }
    }
});

function showResult() {
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';
    document.getElementById('correct-answers').innerText = score;
    // 总题目数应为已完成的题目数
    const totalCompletedQuestions = score + wrongAnswers.length;
    document.getElementById('total-questions-result').innerText = totalCompletedQuestions;

    const errorReviewDiv = document.getElementById('error-review');
    errorReviewDiv.innerHTML = '';
    if (wrongAnswers.length > 0) {
        wrongAnswers.forEach(item => {
            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <h4>${item.word} <span class="text-muted">${item.phonetic}</span></h4>
                <p><strong>您的回答：</strong>${item.userAnswer}</p>
                <p><strong>正确答案：</strong>${currentMode === 'en-cn' ? item.definition : item.word}</p>
                <p><strong>例句：</strong>${item.example}</p>
                <p><strong>例句翻译：</strong>${item.translation}</p>
            `;
            errorReviewDiv.appendChild(div);
        });
    } else {
        errorReviewDiv.innerHTML = '<p>恭喜您，全答对了！</p>';
    }
}

document.getElementById('restart-quiz').addEventListener('click', () => {
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'block';
});

window.onload = fetchBankList;
