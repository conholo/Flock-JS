
class GridCell {

    constructor(character, row, column, cellElement) {
        this.character = character;
        this.row = row;
        this.column = column;
        this.cellElement = cellElement;

        this.cellElement.innerHTML = character;
    }

    setCharacter(character) {
        this.character = character
        this.cellElement.innerHTML = character;
    }
}

class Grid {

    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.lastClicked = null;
        this.grid = createNArray(rows, columns);
        this.gridSize = rows * columns;
        this.generateGrid(rows, columns)
    }

    generateGrid(rows, columns) {
        let grid = document.createElement('table');
        grid.className = 'grid';
        for (let row = 0; row < rows; ++row) {

            let rowElement = grid.appendChild(document.createElement('tr'));

            for (let column = 0; column < columns; ++column) {

                let cellElement = rowElement.appendChild(document.createElement('td'));
                cellElement.addEventListener('click', function(){
                    gridCell.cellElement.className = 'clicked';

                    if(this.lastClicked) this.lastClicked.cellElement.className = '';

                    this.lastClicked = gridCell;

                }.bind(this));

                let gridCell = new GridCell('_', row, column, cellElement);
                this.grid[row][column] = gridCell;
            }
        }

        document.body.appendChild(grid);
    }


    resetGrid() {

        for (let row = 0; row < this.rows; row++) {

            for (let column = 0; column < this.columns; ++column) {

                this.grid[row][column].setCharacter("_");
            }
        }
    }
}

function fillRemainingCells(grid) {
    for(let row = 0; row < grid.rows; row++) {

        for (let column = 0; column < grid.columns; column++) {

            let gridCell = grid.grid[row][column];
            if(gridCell.character !== "_") continue;

            gridCell.setCharacter(alphabet[Math.floor(Math.random() * alphabet.length)].toUpperCase());
        }
    }
}

function createWordSearch(words, grid) {

    let attemptCount = 0;

    while(++attemptCount < 100) {

        // Reset all objects on new attempt.
        shuffle(words);
        grid.resetGrid();
        solutions = [];

        let cellsFilled = 0;
        let target = words.join().replace(/,/g, "").length;

        for(let word of words) {

            cellsFilled += tryPlaceWord(grid, word);

            if(cellsFilled === target) {

                if(solutions.length >= minWords) {

                    attempts = attemptCount;
                    return true;
                }
                break;
            }
        }

    }
    return false;
}


function tryPlaceWord(grid, word) {

    let randomDirection = Math.floor(Math.random() * directions.length);
    let randomPosition = Math.floor(Math.random() * (grid.gridSize + 1))

    for(let direction = 0; direction < directions.length; direction++) {

        direction = (direction + randomDirection) % directions.length;

        for(let position = 0; position < grid.gridSize; position++) {

            position = (position + randomPosition) % grid.gridSize;

            let lettersPlaced = tryLocationForWord(grid, word, direction, position);
            if(lettersPlaced > 0)
                return lettersPlaced;

        }
    }
    return 0;
}

function tryLocationForWord(grid, word, direction, position) {

    let row = Math.floor(position / grid.columns);
    let column = Math.floor(position % grid.columns);

    let length = word.length;

    if((directions[direction][0] === 1 && (length + column) > grid.columns ||
        directions[direction][0] === -1 && (length - 1) > column ||
        directions[direction][1] === 1 && (length + row) > grid.rows ||
        directions[direction][1] === -1 && (length - 1) > row))
        return 0;

    let rowCheck, columnCheck, index, overlaps = 0;

    for(index = 0, rowCheck = row, columnCheck = column; index < length; index++) {

        let cellCharacter = grid.grid[rowCheck][columnCheck].character;
        if ( cellCharacter !== '_' && cellCharacter !== word[index])
            return 0;

        columnCheck += directions[direction][0];
        rowCheck += directions[direction][1];
    }

    for(index = 0, rowCheck = row, columnCheck = column; index < length; index++) {

        if(grid.grid[rowCheck][columnCheck].character === word[index])
            overlaps++;
        else
            grid.grid[rowCheck][columnCheck].setCharacter(word[index]);

        if(index < length - 1) {

            columnCheck += directions[direction][0];
            rowCheck += directions[direction][1];
        }
    }

    let lettersPlaced = length - overlaps;

    if(lettersPlaced > 0)
    {
        let solution = `${word},${-10} (${column},${row})(${columnCheck},${rowCheck})`;
        solutions.push(solution);
    }

    return lettersPlaced;
}

function createNArray(length) {
    let arr = new Array(length || 0),
        i = length;

    if(arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length - 1 - i] = createNArray.apply(this, args);
    }

    return arr;
}

function shuffle(list) {

    let size = list.length;

    while(size > 1) {

        size--;
        let k = Math.floor(Math.random() * (size + 1));

        let value = list[k];
        list[k] = list[size];
        list[size] = value;
    }
}


const minWords = 15;
let attempts = 0;
const words = [

]

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

let solutions = [];

const directions = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
    [1, -1]
]

const difficultyValues = {
    "very easy" : 5,
    "easy" : 10,
    "intermediate": 15,
    "hard" : 20
}

let form = document.getElementById('word-search-form');
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

    const grid = new Grid(rows, columns);
    let result = createWordSearch(words, grid);
    fillRemainingCells(grid);

    const solutionsListing = document.createElement('li');

    for(let solution of solutions) {

        let solutionText = document.createTextNode(solution);
        solutionsListing.appendChild(solutionText);
    }

    solutionsListing.style.color = 'white';
    document.body.appendChild(solutionsListing);
}

form.addEventListener('submit', onSubmitForm);

function validateUserInput() {
    const userTextInput = document.getElementById("enter-word-input");
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
        const submitFormButton = document.getElementById('submit-form-button');
        submitFormButton.disabled = false;
    }
}




