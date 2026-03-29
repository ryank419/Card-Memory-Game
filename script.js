const cardContainer = document.getElementById('cards');
const cardFlipSound = new Audio('sfx/card-flip.wav');
const cardHoverSound = new Audio('sfx/card-hover.wav');
const cardResetSound = new Audio('sfx/card-reset.wav');
const matchRejectSound = new Audio('sfx/match-reject.wav');
const matchAcceptSound = new Audio('sfx/match-accept.wav');
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

difficultySelect.addEventListener('change', () => {
    newGame();
});

document.addEventListener('DOMContentLoaded', () => {
    // Background image scrolling
    let offset = 1;
    setInterval(() => {
        document.documentElement.style.setProperty('--background-offset', `${offset}px`);
        offset -= 1;
    }, 20);

    resetGameButton.addEventListener('click', newGame); // TODO: Delete after testing

    newGame();

});

function winGame() {
    // Play win sound
    // Show win message
    // Play win animation (cards dancing)
    // Play cheering sounds based on the card
    // Start a new game after a delay
}

function newGame() {
    // Reset match count
    matchesFound = 0;
    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;

    // Reset cards based on difficulty
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
            sizeMultiplier = 2.25;
            break;
    }
    choosePairs(difficulty);
    createCards();

    // Change card sizes based on difficulty
    for (let i = 0; i < cardContainer.children.length; i++) {
        cardContainer.children[i].style.setProperty('--size-multiplier', sizeMultiplier);
    }
}

function createCards() {

    // Clear container and create new card elements based on chosenCards
    cardContainer.innerHTML = '';
    for (let i = 0; i < chosenCards.length; i++) { // Create two cards for every pair chosen
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
    const cards = Array.from(cardContainer.querySelectorAll('.card'));

    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    cards.forEach(card => cardContainer.appendChild(card));

    // Add event listeners to cards
    cards.forEach(card => {
        card.addEventListener('click', () => flipCard(card));
        card.addEventListener('mouseover', () => onCardHover(card));
    });
}

function choosePairs(pairs) {
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

function flipCard(card) { // TODO: Possibly reduce the return conditions if possible
    if (!CanFlip) return;
    if (firstCard && secondCard) return; // Don't flip if two cards are already flipped
    if (card.lastElementChild.classList.contains('flipped')) return; // Don't flip if already flipped

    const flipDuration = parseFloat(getComputedStyle(card.lastElementChild).getPropertyValue('--flip-duration')) * 1000;

    card.lastElementChild.classList.toggle('flipped');
    setTimeout(() => { // Change card image halfway through flip
        card.lastElementChild.src = `images/${card.dataset.cardId}.png`;
    }, flipDuration / 2.0);

    // Play flip sound with slight pitch randomization
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
    matchAcceptSound.currentTime = 0;
    matchAcceptSound.play();

    matchesFound++;

    const matchesDisplay = document.getElementById('matches');
    matchesDisplay.textContent = matchesFound;

    firstCard = null;
    secondCard = null;
    CanFlip = true;
    console.log(`Match found! It was ${firstCard.dataset.cardId}. Total matches found: ${matchesFound}`);
}

function rejectMatch() {
    firstCard.lastElementChild.classList.add('rejected');
    secondCard.lastElementChild.classList.add('rejected');
    matchRejectSound.currentTime = 0;
    matchRejectSound.play();

    setTimeout(() => {
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

// Things I want to add:
// - Timer
// - Choosing different card themes (animals, flags, etc.)
// - Different background themes (space, nature, etc.)
// - Mute option
// - Music

// Things I want to improve:
// - Refactor flipCard to maybe get rid of resetCard (although could get too clunky)
// - Make visuals based on hovering over the card itself instead of the image since the image escapes the cursor when it moves sometimes