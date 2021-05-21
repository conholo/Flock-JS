import * as ws_utility from './word_search_utility.js';
import {generateWordSearch} from './word_search_generator.js';


// Determines size of the grid.
const difficultyValues = {
    "very easy" : 5,
    "easy" : 10,
    "intermediate": 15,
    "hard" : 20
}

const wordSelectionParameters = {

    "very easy" : {
        "very small": 10,
        "small": 0,
        "medium": 0,
        "long": 0
    },

    "easy" : {
        "very small": 6,
        "small": 4,
        "medium": 2,
        "long": 0
    },

    "intermediate" : {
        "very small": 3,
        "small": 5,
        "medium": 6,
        "long": 2
    },

    "hard" : {
        "very small": 9,
        "small": 4,
        "medium": 12,
        "long": 5
    }
}



let form = document.getElementById('word-search-form');
form.addEventListener('submit', onSubmitForm);
let words = [];

function onGameFinished() {
    alert("You won!");
}

let postData = {
    "Difficulty": null,
    "Words": null
}

function onSubmitForm(event) {

    event.preventDefault();


    let difficultyRadios = document.getElementsByName("difficulty");

    let checkedRadio = null;
    let rows, columns = 0;

    for(let i = 0; i < difficultyRadios.length; i++) {
        if(difficultyRadios[i].checked)
            checkedRadio = difficultyRadios[i];
    }

    rows = difficultyValues[checkedRadio.value];
    columns = difficultyValues[checkedRadio.value];

    document.getElementById('word-search-container').hidden = true;

    let wordsToUse = words;

    if(!document.getElementById('user_words_checkbox').checked) {

        const generatedWords = ws_utility.generate_words('../assets/files/words.txt');

        const wordCount = 10;
        wordsToUse = []

        let wordParametersForDifficulty = wordSelectionParameters[checkedRadio.value];

        while(wordsToUse.length < wordCount) {

            for(const [lengthDescriptor, count] of Object.entries(wordParametersForDifficulty)) {

                let wordsOfLength = generatedWords[lengthDescriptor];

                for(let i = 0; i < count; i++) {
                    let word = wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)];

                    if(wordsToUse.includes(word.toUpperCase())) continue;

                    wordsToUse.push(word.toUpperCase());
                }

            }
        }

        words = wordsToUse;
    }

    postData.Difficulty = checkedRadio.value;
    postData.Words = words;

    let request = new XMLHttpRequest();
    request.open('POST', 'http://httpbin.org/post', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', function(){
        if(request.status >= 200 && request.status < 400){
            let response = JSON.parse(request.responseText);
            console.log(response.data);
        }else{
            alert("Error in network request: " + request.statusText);
        }
    })
    request.send(JSON.stringify(postData));

    let instructionsText = document.getElementById('instructions-text');
    const wordSearchResults = generateWordSearch(words, rows, columns, onGameFinished);
    const grid = wordSearchResults[0];

    const wordSearchTableContainer = document.createElement('div');
    wordSearchTableContainer.id = 'word-search-table-container';
    document.body.appendChild(wordSearchTableContainer);

    wordSearchTableContainer.appendChild(document.getElementById('word-search-table'));
    instructionsText.style.display = 'block';

    const solutionsListing = wordSearchResults[1];
    solutionsListing.style.color = 'white';
    wordSearchTableContainer.appendChild(solutionsListing);
}


const userTextInput = document.getElementById('enter-word-input');
userTextInput.addEventListener('keyup', validateUserInput);

const enterOwnWordsCheckbox = document.getElementById("user_words_checkbox");
enterOwnWordsCheckbox.addEventListener("change", onUserEnterOwnWordsChanged);

const submitWordButton = document.getElementById('submit-word-button');
submitWordButton.addEventListener('click', onUserSubmitWord);

const submitFormButton = document.getElementById('submit-form-button');

const userEnterWordContainer = document.getElementById('user_enter_word_container');

const userWordsContainerElements = document.getElementsByClassName('word-container-element');

function onUserEnterOwnWordsChanged() {

    if(enterOwnWordsCheckbox.checked) {
        userEnterWordContainer.hidden = false;
        submitFormButton.disabled = words.length <= 0;

        for(let i = 0; i < userWordsContainerElements.length; i++) {
            userWordsContainerElements[i].style.display = '';
        }

    }else {
        userEnterWordContainer.hidden = true;
        submitFormButton.disabled = false;
        for(let i = 0; i < userWordsContainerElements.length; i++) {
            userWordsContainerElements[i].style.display = 'none';
        }
    }
}


function validateUserInput(e) {
    const submitWordButton = document.getElementById('submit-word-button');

    const invalidTextElement = document.getElementById("invalid-input");
    let regexExpression = /^[a-zA-Z]+$/;

    if(!regexExpression.test(userTextInput.value)){

        if(userTextInput.value.length > 0) {
            invalidTextElement.innerHTML = "Invalid character detected.  Please only enter characters.";
        }else{
            invalidTextElement.innerHTML = "";
            submitWordButton.disabled = true;
        }
        submitWordButton.disabled = true;
    }
    else{
        invalidTextElement.innerHTML = "";
        submitWordButton.disabled = false;
    }
}



function onUserSubmitWord() {
    const userTextInput = document.getElementById("enter-word-input");
    const wordList = document.getElementById("word-list");

    let listItem = document.createElement('li');
    listItem.innerHTML = userTextInput.value.toUpperCase();
    wordList.appendChild(listItem);
    words.push(userTextInput.value.toUpperCase());

    if(words.length > 0) {
        submitFormButton.disabled = false;
    }

    userTextInput.value = '';
    submitWordButton.disabled = true;
}




