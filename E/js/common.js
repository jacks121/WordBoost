// 题库列表
const WORD_BANKS = ['E1', 'E2'];

// 加载题库
async function loadWordBank(bankName) {
    try {
        const response = await fetch(`data/${bankName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // 过滤掉已掌握的单词
        const masteredWords = getMasteredWords(bankName);
        return data.words.filter(word => !masteredWords.includes(word.word));
    } catch (error) {
        console.error('Error loading word bank:', error);
        return [];
    }
}

// 检查题库是否可用
async function checkWordBank(bankName) {
    try {
        const response = await fetch(`data/${bankName}.json`);
        return response.ok;
    } catch {
        return false;
    }
}

// 获取可用的题库列表
async function getAvailableBanks() {
    const availableBanks = [];
    for (const bank of WORD_BANKS) {
        if (await checkWordBank(bank)) {
            availableBanks.push(bank);
        }
    }
    return availableBanks;
}

// 获取已掌握的单词列表
function getMasteredWords(bankName) {
    const masteredWords = localStorage.getItem(`mastered_${bankName}`);
    return masteredWords ? JSON.parse(masteredWords) : [];
}

// 添加已掌握的单词
function addMasteredWord(bankName, word) {
    const masteredWords = getMasteredWords(bankName);
    if (!masteredWords.includes(word)) {
        masteredWords.push(word);
        localStorage.setItem(`mastered_${bankName}`, JSON.stringify(masteredWords));
    }
}

// 更新题库选择器显示
async function updateBankSelector() {
    const banks = await getAvailableBanks();
    const $selector = $('#word-bank');
    $selector.empty();
    
    for (const bank of banks) {
        const words = await loadWordBank(bank);
        const masteredWords = getMasteredWords(bank);
        const totalCount = (await loadWordBank(bank)).length + masteredWords.length;
        const masteredCount = masteredWords.length;
        
        $selector.append(`
            <option value="${bank}">
                ${bank} (已掌握: ${masteredCount}/${totalCount})
            </option>
        `);
    }
}

// 初始化题库选择器和加载题库
async function initWordBankSelector(callback) {
    const $selector = $('#word-bank');
    
    // 获取可用题库并更新选择器
    const banks = await getAvailableBanks();
    if (banks.length === 0) {
        alert('没有找到可用的题库！');
        return;
    }
    
    // 加载第一个可用的题库
    const bankName = banks[0];
    const words = await loadWordBank(bankName);
    if (words.length > 0) {
        shuffleArray(words);
        if (callback) callback(words);
    }
    
    // 监听题库选择变化
    $selector.off('change').on('change', async function() {
        const selectedBank = $(this).val();
        const newWords = await loadWordBank(selectedBank);
        if (newWords.length > 0) {
            shuffleArray(newWords);
            if (callback) callback(newWords);
        }
    });
}

// 获取随机选项
function getRandomOptions(words, correctWord, count = 4) {
    const options = [correctWord];
    const otherWords = words.filter(word => word !== correctWord);
    shuffleArray(otherWords);
    
    while (options.length < count && otherWords.length > 0) {
        options.push(otherWords.pop());
    }
    
    shuffleArray(options);
    return options;
}

// 打乱数组顺序
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 更新进度条
function updateProgress(currentIndex, totalLength) {
    const progress = ((currentIndex + 1) / totalLength) * 100;
    $('#progress-bar').css('width', `${progress}%`);
    $('#progress-text').text(`${currentIndex + 1} / ${totalLength}`);
}

// 显示结果
function showResult(score, wrongAnswers) {
    const totalQuestions = score + wrongAnswers.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    $('#result-section').html(`
        <div class="text-center mb-4">
            <h3>测试完成！</h3>
            <p class="lead">得分：${score}/${totalQuestions} (${percentage}%)</p>
        </div>
        ${wrongAnswers.length > 0 ? `
            <div class="wrong-answers mb-4">
                <h4>需要复习的单词：</h4>
                <div class="list-group">
                    ${wrongAnswers.map(word => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="mb-1">${word.word}</h5>
                                    <p class="mb-1 text-muted">${word.phonetic}</p>
                                    <p class="mb-1">${word.definition}</p>
                                </div>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">${word.example}</small><br>
                                <small class="text-muted">${word.translation}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        <div class="text-center">
            <button id="restart" class="btn btn-primary">重新开始</button>
        </div>
    `).show();
} 