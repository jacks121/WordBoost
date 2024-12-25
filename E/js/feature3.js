// 全局变量
let currentWords = [];
let currentIndex = 0;
let currentBank = 'E1';

// 初始化
$(document).ready(async function() {
    // 更新题库选择器显示
    await updateBankSelector();
    
    // 初始化题库选择器和加载题库
    initWordBankSelector(words => {
        currentWords = words;
        currentIndex = 0;
        showNextCard();
    });

    // 显示下一张卡片
    function showNextCard() {
        if (currentIndex >= currentWords.length) {
            alert('恭喜！你已完成所有单词的学习。');
            currentIndex = 0;
            shuffleArray(currentWords);
        }

        const currentWord = currentWords[currentIndex];
        
        // 更新正面内容（英文单词和音标）
        $('#question').html(`
            <div class="word mb-2">${currentWord.word}</div>
            <div class="phonetic text-muted">${currentWord.phonetic}</div>
        `);

        // 更新背面内容（中文释义、例句和翻译）
        $('#answer').html(`
            <div class="definition mb-3">${currentWord.definition}</div>
            <div class="example mb-2">${currentWord.example}</div>
            <div class="translation text-muted">${currentWord.translation}</div>
        `);

        // 更新进度
        updateProgress(currentIndex, currentWords.length);
        $('#current-number').text(currentIndex + 1);
        $('#total-number').text(currentWords.length);

        // 重置卡片状态
        $('#flip-card').removeClass('flipped');
    }

    // 处理卡片翻转
    $('#flip-card').on('mousedown touchstart', function() {
        $(this).addClass('flipped');
    }).on('mouseup mouseleave touchend touchcancel', function() {
        $(this).removeClass('flipped');
    });

    // 标记为已掌握
    $('#mark-known').click(function() {
        const currentWord = currentWords[currentIndex];
        addMasteredWord(currentBank, currentWord.word);
        currentIndex++;
        showNextCard();
        updateBankSelector();
    });

    // 标记为需要复习
    $('#mark-unknown').click(function() {
        currentIndex++;
        showNextCard();
    });

    // 监听题库选择变化
    $('#word-bank').change(function() {
        currentBank = $(this).val();
    });
}); 