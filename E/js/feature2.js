// 全局变量
let currentWords = [];
let currentIndex = 0;
let score = 0;
let wrongAnswers = [];
let currentBank = 'E1';

// 初始化
$(document).ready(async function() {
    // 更新题库选择器显示
    await updateBankSelector();

    // 初始化题库选择器和加载题库
    initWordBankSelector(words => {
        currentWords = words;
        currentIndex = 0;
        score = 0;
        wrongAnswers = [];
        showNextQuestion();
    });

    // 显示下一题
    function showNextQuestion() {
        if (currentIndex >= currentWords.length) {
            showResult(score, wrongAnswers);
            return;
        }

        const currentWord = currentWords[currentIndex];
        $('#chinese-definition').text(currentWord.definition);
        
        const options = getRandomOptions(currentWords, currentWord);
        $('#english-options').empty();
        options.forEach(option => {
            $('#english-options').append(`
                <button class="btn btn-outline-primary option-btn mb-2" data-word="${option.word}">
                    ${option.word}
                </button>
            `);
        });

        updateProgress(currentIndex, currentWords.length);
        $('#feedback').hide();
        $('#example-section').hide();
        $('#submit-answer').show().prop('disabled', true); // 初始状态禁用提交按钮
        $('#mark-known').hide();
        $('#next-question').hide();

        // 重新绑定选项点击事件
        $('.option-btn').off('click').on('click', function() {
            if ($(this).prop('disabled')) return;
            $('.option-btn').removeClass('active');
            $(this).addClass('active');
            $('#submit-answer').prop('disabled', false);
        });
    }

    // ��交答案
    $('#submit-answer').off('click').on('click', function() {
        if ($(this).prop('disabled')) return;

        const selectedOption = $('.option-btn.active');
        if (selectedOption.length === 0) {
            alert('请选择一个答案');
            return;
        }

        const selectedWord = selectedOption.data('word');
        const currentWord = currentWords[currentIndex];
        const isCorrect = selectedWord === currentWord.word;

        if (isCorrect) {
            score++;
            $('#feedback').removeClass('alert-danger').addClass('alert-success')
                .html('✅ 回答正确！').show();
            $('#example-section').html(`
                <div class="mt-3 p-3 bg-light rounded">
                    <div class="phonetic text-muted mb-2">${currentWord.phonetic}</div>
                    <div class="example mb-2">${currentWord.example}</div>
                    <div class="translation text-muted">${currentWord.translation}</div>
                </div>
            `).show();
            // 显示已掌握按钮
            $('#mark-known').show();
            // 连续答对三次，标记为已掌握
            if (isWordMasteredInSession(currentWord.word)) {
                addMasteredWord(currentBank, currentWord.word);
                updateBankSelector();
                $('#mark-known').hide(); // 已自动标记为掌握，隐藏按钮
            }
        } else {
            wrongAnswers.push(currentWord);
            $('#feedback').removeClass('alert-success').addClass('alert-danger')
                .html(`❌ 回答错误。正确答案是：${currentWord.word}`).show();
            // 答错时重置该单词的连续正确次数
            resetWordMasteryProgress(currentWord.word);
        }

        $('.option-btn').prop('disabled', true);
        $('#submit-answer').hide();
        $('#next-question').show();
    });

    // 标记已掌握
    $('#mark-known').off('click').on('click', function() {
        const currentWord = currentWords[currentIndex];
        addMasteredWord(currentBank, currentWord.word);
        updateBankSelector();
        $(this).prop('disabled', true).html('<i class="bi bi-check-lg"></i> 已掌握');
    });

    // 下一题
    $('#next-question').off('click').on('click', function() {
        currentIndex++;
        showNextQuestion();
    });

    // 重新开始
    $('#restart').off('click').on('click', function() {
        currentIndex = 0;
        score = 0;
        wrongAnswers = [];
        shuffleArray(currentWords);
        showNextQuestion();
        $('#result-section').hide();
    });

    // 记录单词掌握进度的Map
    const wordMasteryProgress = new Map();

    // 检查单词是否在本次学习中已掌握（连续答对3次）
    function isWordMasteredInSession(word) {
        const progress = wordMasteryProgress.get(word) || 0;
        const newProgress = progress + 1;
        wordMasteryProgress.set(word, newProgress);
        return newProgress >= 3;
    }

    // 重置单词的掌握进度
    function resetWordMasteryProgress(word) {
        wordMasteryProgress.set(word, 0);
    }
}); 