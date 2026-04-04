const cardContainer = document.getElementById('cards');
const sfx = {
    cardFlip: new Audio('sfx/card-flip.wav'),
    cardHover: new Audio('sfx/card-hover.wav'),
    cardReset: new Audio('sfx/card-reset.wav'),
    matchReject: new Audio('sfx/match-reject.wav'),
    matchAccept: new Audio('sfx/match-accept.wav'),
    cheerSounds: {
        king: new Audio('sfx/cheer-king.wav'),
        queen: new Audio('sfx/cheer-queen.wav'),
        jack: new Audio('sfx/cheer-jack.wav'),
        random: [new Audio('sfx/cheer1.wav'), new Audio('sfx/cheer2.wav'), new Audio('sfx/cheer3.wav')]
    }
}

let sfxVolume = 1;
let musicVolume = 1;
let sfxMuted = false;
let musicMuted = false;

const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-button'));
const volumeControls = document.querySelectorAll('.volume-control');
const sfxIcon = document.getElementById('sfx-icon');
const musicIcon = document.getElementById('music-icon');

const timeoutIds = []; // Array to keep track of active timeouts for cleanup on game reset

let availableCards = ["hearts-ace", "hearts-2", "hearts-3", "hearts-4", "hearts-5", "hearts-6", "hearts-7", "hearts-8", "hearts-9", "hearts-10", "hearts-jack", "hearts-queen", "hearts-king",
    "diamonds-ace", "diamonds-2", "diamonds-3", "diamonds-4", "diamonds-5", "diamonds-6", "diamonds-7", "diamonds-8", "diamonds-9", "diamonds-10", "diamonds-jack", "diamonds-queen", "diamonds-king",
    "clubs-ace", "clubs-2", "clubs-3", "clubs-4", "clubs-5", "clubs-6", "clubs-7", "clubs-8", "clubs-9", "clubs-10", "clubs-jack", "clubs-queen", "clubs-king",
    "spades-ace", "spades-2", "spades-3", "spades-4", "spades-5", "spades-6", "spades-7", "spades-8", "spades-9", "spades-10", "spades-jack", "spades-queen", "spades-king"
];

const difficulties = { // [pairs, cards per row, size multiplier, reveal time]
    "easy": [5, 5, 3, 1500],
    "medium": [9, 6, 2.5, 2000],
    "hard": [16, 8, 2.25, 3000],
    "testing": [2, 4, 3, 3000] // TODO: Delete after testing
};

let chosenCards = [];
let firstCard, secondCard;
let difficulty = difficulties.easy;
let matchesFound = 0;
let timer = 0;
let isTimerRunning = false;
let music = new Audio('music/card-game-theme-classic.wav');

// Only play music after first interaction with page (for autoplay policies)
function onFirstInteraction() {
    playBGMLoop();
    ["click", "keydown", "touchstart"].forEach(event =>
        window.removeEventListener(event, onFirstInteraction, { once: true })
    );
}

const audioCtx = new AudioContext();
const musicGainNode = audioCtx.createGain();
musicGainNode.gain.value = musicVolume;
musicGainNode.connect(audioCtx.destination);

async function playBGMLoop() {
    const response = await fetch("music/card-game-theme-classic.wav");
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    source.connect(musicGainNode);
    source.start(0);
}

document.addEventListener('DOMContentLoaded', () => { // Ensure DOM is loaded before doing important initialization stuff
    // Background image scrolling
    let offset = 0;
    setInterval(() => {
        document.documentElement.style.setProperty('--background-offset', `${offset}px`);
        offset -= 1;
        offset = offset % 128;
    }, 20);

    // Register event listeners

    const musicSlider = document.getElementById('music-volume-slider');
    const sfxSlider = document.getElementById('sfx-volume-slider');
    volumeControls.forEach(control => {
        const icon = control.querySelector('.volume-icon');

        musicSlider.addEventListener('input', () => {
            setMusicVolume(musicSlider.value);
        });

        sfxSlider.addEventListener('input', () => {
            setSFXVolume(sfxSlider.value);
        });

        icon.addEventListener('click', () => {
            if (icon === sfxIcon) {
                sfxMuted = !sfxMuted;
                control.classList.toggle('muted', sfxMuted);
            }
            if (icon === musicIcon) {
                musicMuted = !musicMuted;
                control.classList.toggle('muted', musicMuted);
                updateMusicVolume();
            }
        });
    });
    musicGainNode.gain.value = musicSlider.value;
    
    ["click", "keydown", "touchstart"].forEach(event =>
        window.addEventListener(event, onFirstInteraction)
    );

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficulty = difficulties[button.dataset.difficulty];
            newGame();
        });
    });


    newGame();

});

function winGame() { // TODO: Finish implementing this fully
    const cards = Array.from(document.querySelectorAll('.card'));
    // Play win sound
    // Show win message
    // Play win animation (cards dancing)
    cards.forEach(card => {
        setTrackedTimeout(() => {
            card.classList.add('cheering');
        }, Math.floor(Math.random() * 7) * 100);
    });

    // Play cheering sounds based on the card
    chosenCards.forEach(cardId => {
        setTrackedTimeout(() => {
            playCheerSound(cardId);
        }, Math.floor(Math.random() * 7) * 100);
    });

    // Start a new game after a delay
    setTrackedTimeout(() => {
        newGame();
    }, 4000);
}

function playCheerSound(cardId) { // Plays a cheer sound for specified cards, random ones for unspecified
    let cheerSound = sfx.cheerSounds.random[Math.floor(Math.random() * sfx.cheerSounds.random.length)];
    if (cardId.includes('king')) {
        cheerSound = sfx.cheerSounds.king;
    } else if (cardId.includes('queen')) {
        cheerSound = sfx.cheerSounds.queen;
    } else if (cardId.includes('jack')) {
        cheerSound = sfx.cheerSounds.jack;
    }
    cheerSound = cheerSound.cloneNode(); // Allows for multiple simultaneous cheer sounds
    cheerSound.preservesPitch = false;
    cheerSound.playbackRate = 0.8 + Math.random() * 0.4;
    cheerSound.volume = sfxMuted ? 0 : sfxVolume;
    cheerSound.play();
    console.log(`Card ${cardId} is cheering! Cheer sound: ${cheerSound.src}`); // TODO: Delete after testing
}

function newGame() { // Resets the game with new cards (based on the current difficulty)
    // Clear any active timeouts to prevent them from affecting the new game
    clearTrackedTimeouts();
    // Reset match count and first/second card variables
    clearPair();
    resetTimer();
    matchesFound = 0;
    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;

    // Reset cards based on difficulty
    const sizeMultiplier = difficulty[2];
    setCardsPerRow(difficulty[1]);
    choosePairs(difficulty[0]);
    createCards();

    // Change card sizes based on difficulty
    for (let i = 0; i < cardContainer.children.length; i++) {
        cardContainer.children[i].style.setProperty('--size-multiplier', sizeMultiplier);
    }
}

function createCards() { // Creates a pair of card elements from randomly chosen card IDs

    // Clear container and create new card elements based on chosenCards
    cardContainer.innerHTML = '';
    for (let i = 0; i < chosenCards.length; i++) { // Create two cards for every pair chosen
        cardContainer.innerHTML += `
        <span class="card" data-card-id="${chosenCards[i]}">
            <img src="images/cards-classic/card-back.png" class="card-img">
        </span>
        <span class="card" data-card-id="${chosenCards[i]}">
            <img src="images/cards-classic/card-back.png" class="card-img">
        </span>
    `;
    }

    // Shuffle cards using Fisher-Yates algorithm
    const cards = Array.from(cardContainer.querySelectorAll('.card'));
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    cards.forEach(card => cardContainer.appendChild(card)); // Doesn't add duplicate cards, just reorders them since they're already in the container

    // Add event listeners to cards
    cards.forEach(card => {
        setTrackedTimeout(() => {
            flipCard(card); // Flip all cards face up at the start of the game for a brief moment to let the player memorize them
            setTrackedTimeout(() => {
                flipCard(card);
                card.addEventListener('click', () => selectCard(card));
                card.addEventListener('mouseover', () => onCardHover(card));
            }, difficulty[3]); // Waits the specified reveal time based on the difficulty
        }, 300);
    });
}

function choosePairs(pairs) { // Chooses random pairs of cards from availableCards and stores them in chosenCards
    chosenCards = []; // Array for chosen card pairs
    pairs = Number(pairs);
    for (let i = 0; i < pairs; i++) {
        let chosenPair = availableCards[Math.floor(Math.random() * availableCards.length)];
        while (chosenCards.includes(chosenPair)) { // Keep choosing until we get a card that hasn't been chosen yet
            chosenPair = availableCards[Math.floor(Math.random() * availableCards.length)];
        }
        chosenCards[i] = chosenPair;
    }
}

function selectCard(card) { // Handles the logic for when a card is clicked
    if (card.classList.contains('matched')) return;
    if (!isTimerRunning) startTimer();
    if (!firstCard) {
        firstCard = card;
    }
    else if (!secondCard && card !== firstCard) {
        secondCard = card;
    } else return;
    flipCard(card);
    if (firstCard && secondCard) checkPair();
}

function flipCard(card) {

    const flipDuration = parseFloat(getComputedStyle(card.lastElementChild).getPropertyValue('--flip-duration')) * 1000;
    // Don't need CanFlip anymore (or any boolean to track) since you can only select a card if a pair hasn't been flipped yet

    card.classList.toggle('flipped');
    if (card.classList.contains('flipped')) { // Not flipped -> Flipped

        setTrackedTimeout(() => {
            card.lastElementChild.src = `images/cards-classic/${card.dataset.cardId}.png`;
        }, flipDuration / 2.0);
        playSFX(sfx.cardFlip, true, 0.2);

    } else { // Flipped -> Not flipped
        setTrackedTimeout(() => {
            card.lastElementChild.src = `images/cards-classic/card-back.png`;
        }, flipDuration / 2.0);
        playSFX(sfx.cardReset, true, 0.2);
    }
}

function checkPair() { // Checks if a selected pair of cards is a match
    setTrackedTimeout(() => {
        if (firstCard.dataset.cardId === secondCard.dataset.cardId) {
            acceptMatch();
        }
        else {
            rejectMatch();
        }
    }, 400);
}

// TODO: Review this later, might simplify by using an array for selected cards instead of firstCard/secondCard variables
// - Array would also allow for expanding to match 3 or more in the future
function clearPair() {
    firstCard = null;
    secondCard = null;
}

function acceptMatch() {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    playSFX(sfx.matchAccept, true);

    // Increment match count and update display
    matchesFound++;
    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;

    clearPair();

    // Win the game if all cards are matched
    if (matchesFound === difficulty[0]) {
        stopTimer();
        setTrackedTimeout(() => {
            winGame();
        }, 700);
    }
}

function rejectMatch() {
    const first = firstCard;
    const second = secondCard;
    firstCard.classList.add('rejected');
    secondCard.classList.add('rejected');
    playSFX(sfx.matchReject, true);
    clearPair();

    setTrackedTimeout(() => {
        flipCard(first);
        flipCard(second);
        first.classList.remove('rejected');
        second.classList.remove('rejected');
    }, 500);
}

function setCardsPerRow(n) {
    const value = Number(n) || 5;
    cardContainer.style.setProperty('--cards-per-row', value);
}

let timerInterval;
let timerStart = null;
function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerStart = performance.now() - timer;
    timerInterval = setInterval(() => {
        timer = Math.floor(performance.now() - timerStart);
        const milliseconds = (timer % 1000).toString().padStart(3, '0');
        const seconds = (Math.floor(timer / 1000) % 60).toString().padStart(2, '0');
        const minutes = Math.floor(timer / 60000).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}:${milliseconds}`;
    }, 16);
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

function resetTimer() {
    stopTimer();
    timer = 0;
    document.getElementById('timer').textContent = '00:00.000';
}


function onCardHover(card) {

    // Play hover sound only if the card is not flipped
    if (!card.classList.contains('flipped')) {
        playSFX(sfx.cardHover, true, 0.2);
    }
}

function setSFXVolume(value) {
    value = Number(value);
    sfxVolume = value;
    sfxIcon.classList.toggle('muted', value === 0);
    console.log(`SFX volume set to ${value}`); // TODO: Delete after testing
}

function playSFX(audio, repeat = false, randomPitchRange = 0) {
    if (repeat) audio.currentTime = 0;
    audio.volume = sfxMuted ? 0 : sfxVolume;
    audio.playbackRate = 1 - (randomPitchRange / 2) + Math.random() * randomPitchRange;
    audio.preservesPitch = false;
    audio.play();
}

function setMusicVolume(value) {
    value = Number(value);
    musicVolume = value;
    updateMusicVolume();
    musicIcon.classList.toggle('muted', value === 0);
    console.log(`Music volume set to ${value}`); // TODO: Delete after testing
}

function updateMusicVolume() {
    musicGainNode.gain.value = musicMuted ? 0 : musicVolume;
    console.log(`Music volume updated. Muted: ${musicMuted}, Volume: ${musicVolume}`); // TODO: Delete after testing
}

function setTrackedTimeout(callback, delay) {// Tracks all timeouts set by this function
    const timeoutId = setTimeout(callback, delay);
    timeoutIds.push(timeoutId);
    return timeoutId;
}

function clearTrackedTimeouts() { // Allows for canceling all timeouts (for restarting the game without old timeouts interfering)
    timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutIds.length = [];
}

// Things I want to add:
// - Choosing different card themes (animals, flags, etc.)
// - Different background themes (space, nature, etc.)
// - Match 3
// - Mode that shuffles cards every time you miss two matches in a row
// - Hints
// - Music
// - Win sound
// - Combo counter

// Things I want to improve:
// - Make visuals based on hovering over the card itself instead of the image since the image escapes the cursor when it moves sometimes

// Feedback received:
// - Audio too loud (Fixed)
// - "Custom" difficulty

// Suggestions:
// - Add volume sliders for music and sfx instead of just mute buttons