const cardContainer = document.getElementById('cards');
const cardFlipSound = new Audio('sfx/card-flip.wav');
const cardHoverSound = new Audio('sfx/card-hover.wav');
const cardResetSound = new Audio('sfx/card-reset.wav');
const matchRejectSound = new Audio('sfx/match-reject.wav');
const resetGameButton = document.getElementById('reset-game-button');
const difficultySelect = document.getElementById('difficulty-select');

let CanFlip = true;
let firstCard, secondCard;
let matchesFound = 0;

const availableCards = ["hearts-ace", "hearts-2", "hearts-3", "hearts-4", "hearts-5", "hearts-6", "hearts-7", "hearts-8", "hearts-9", "hearts-10", "hearts-jack", "hearts-queen", "hearts-king",
    "diamonds-ace", "diamonds-2", "diamonds-3", "diamonds-4", "diamonds-5", "diamonds-6", "diamonds-7", "diamonds-8", "diamonds-9", "diamonds-10", "diamonds-jack", "diamonds-queen", "diamonds-king",
    "clubs-ace", "clubs-2", "clubs-3", "clubs-4", "clubs-5", "clubs-6", "clubs-7", "clubs-8", "clubs-9", "clubs-10", "clubs-jack", "clubs-queen", "clubs-king",
    "spades-ace", "spades-2", "spades-3", "spades-4", "spades-5", "spades-6", "spades-7", "spades-8", "spades-9", "spades-10", "spades-jack", "spades-queen", "spades-king"];

let chosenCards = [];

const difficulties = {
    "Easy": 5,
    "Medium": 9,
    "Hard": 16
};
let difficulty = difficulties[difficultySelect.value];

resetGameButton.addEventListener('click', newGame);

difficultySelect.addEventListener('change', () => {
    newGame();
});

document.addEventListener('DOMContentLoaded', () => {
    newGame();
    let offset = 1;
    setInterval(() => {
        offset -= 1;
        document.documentElement.style.setProperty('--background-offset', `${offset}px`);

    }, 20);

});

function newGame() {
    let sizeMultiplier = 1;
    difficulty = difficulties[difficultySelect.value];
    switch (difficultySelect.value) {
        case "Easy":
            setCardsPerRow(5);
            sizeMultiplier = 3;
            break;
        case "Medium":
            setCardsPerRow(6);
            sizeMultiplier = 2.5;

            break;
        case "Hard":
            setCardsPerRow(8);
            sizeMultiplier = 2;
            break;
    }
    
    matchesFound = 0;
    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;
    choosePairs(difficulty);
    createCards();

    for (let i = 0; i < cardContainer.children.length; i++) {
        cardContainer.children[i].style.setProperty('--size-multiplier', sizeMultiplier);
    }
}

function createCards() {

    // Clear container and create new card elements based on chosenCards
    cardContainer.innerHTML = '';
    for (let i = 0; i < chosenCards.length; i++) {
        cardContainer.innerHTML += `
        <span class="card" data-card-id="${chosenCards[i]}">
            <img src="images/card-back.png" class="card-img">
        </span>
        <span class="card" data-card-id="${chosenCards[i]}">
            <img src="images/card-back.png" class="card-img">
        </span>
    `;
    }

    // Shuffle cards using Fisher-Yates algorithm
    const elements = Array.from(cardContainer.children);

    for (let i = elements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elements[i], elements[j]] = [elements[j], elements[i]];
    }
    elements.forEach(el => cardContainer.appendChild(el));

    // Add event listeners to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => flipCard(card));
        card.addEventListener('mouseover', () => onCardHover(card));
        card.addEventListener('mouseout', () => onCardLeave(card));
    });
}

function choosePairs(pairs) {
    chosenCards = [];
    pairs = Number(pairs) || 5;
    for (let i = 0; i < pairs; i++) {
        let chosenPair = availableCards[Math.floor(Math.random() * availableCards.length)];
        while (chosenCards.includes(chosenPair)) {
            chosenPair = availableCards[Math.floor(Math.random() * availableCards.length)];
        }
        chosenCards[i] = chosenPair;
    }
}

function flipCard(card) {
    if (!CanFlip) return;
    if (firstCard && secondCard) return; // Don't flip if two cards are already flipped
    if (card.lastElementChild.classList.contains('flipped')) return; // Don't flip if already flipped

    const flipDuration = parseFloat(getComputedStyle(card.lastElementChild).getPropertyValue('--flip-duration')) * 1000;

    card.lastElementChild.classList.toggle('flipped');
    setTimeout(() => {
        card.lastElementChild.src = `images/${card.dataset.cardId}.png`;
    }, flipDuration / 2.0); // Delay to allow flip animation

    // Play flip sound with slight pitch variation
    cardFlipSound.currentTime = 0;
    cardFlipSound.playbackRate = 0.9 + Math.random() * 0.2;
    cardFlipSound.preservesPitch = false;
    cardFlipSound.play();

    if (!firstCard) {
        firstCard = card;
    }
    if (!secondCard && card !== firstCard) {
        secondCard = card;
        CanFlip = false;
        checkPair();
    }
}

function checkPair() {
    setTimeout(() => {
        if (firstCard.dataset.cardId === secondCard.dataset.cardId) {
            acceptMatch();
        }
        else {
            rejectMatch();
        }
    }, 600);
}

function acceptMatch() {
    firstCard.lastElementChild.classList.add('matched');
    secondCard.lastElementChild.classList.add('matched');
    matchesFound++;

    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;

    CanFlip = true;
    firstCard = null;
    secondCard = null;
    console.log(`Match found! It was ${firstCard.dataset.cardId}. Total matches found: ${matchesFound}`);
}

function rejectMatch() {
    matchRejectSound.play();
    firstCard.lastElementChild.classList.add('rejected');
    secondCard.lastElementChild.classList.add('rejected');
    setTimeout(() => {
        console.log(`No match! First card: ${firstCard.dataset.cardId}, Second card: ${secondCard.dataset.cardId}`);
        resetCard(firstCard);
        resetCard(secondCard);

        firstCard = null;
        secondCard = null;
        CanFlip = true;
    }, 500);
}

function resetCard(card) {
    const flipDuration = parseFloat(getComputedStyle(card.lastElementChild).getPropertyValue('--flip-duration')) * 1000;
    card.lastElementChild.classList.remove('rejected');
    card.lastElementChild.classList.remove('flipped');
    setTimeout(() => {
        card.lastElementChild.src = 'images/card-back.png';
    }, flipDuration / 2.0);
    setTimeout(() => { CanFlip = true; }, flipDuration);

    cardResetSound.play();
}

function setCardsPerRow(n) {
    const value = Number(n) || 5;
    cardContainer.style.setProperty('--cards-per-row', value);
}


function onCardHover(card) {

    // Play hover sound only if the card is not flipped
    if (!card.lastElementChild.classList.contains('flipped')) {
        cardHoverSound.currentTime = 0;
        cardHoverSound.playbackRate = 0.9 + Math.random() * 0.2;
        cardHoverSound.preservesPitch = false;
        cardHoverSound.play();
    }
}

/* TODO: Remove this function if not needed */
function onCardLeave(card) {
    return;
}
