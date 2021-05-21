class GridCell {

    constructor(character, row, column, cellElement) {
        this.character = character;
        this.row = row;
        this.column = column;
        this.cellElement = cellElement;
        this.isWordCharacter = false;

        this.cellElement.innerHTML = character;
    }

    setCharacter(character) {
        this.character = character
        this.cellElement.innerHTML = character;
    }
}

class WordHolder {

    constructor(word, startCell, endCell, betweenCells, solution) {

        this.solved = false;
        this.word = word;
        this.startGridCell = startCell;
        this.endGridCell = endCell;
        this.betweenCells = betweenCells;
        this.solution = solution;
        this.solutionElement = document.createElement('li');
        this.solutionElement.innerHTML = word;
    }

    handleOnSolvedWord() {
        this.solved = true;
        this.startGridCell.cellElement.className = 'solved';
        this.startGridCell.solved = true;
        for(let i = 0; i < this.betweenCells.length; i++) {
            this.betweenCells[i].cellElement.className = 'solved';
            this.betweenCells[i].solved = true;
        }
        this.endGridCell.cellElement.className = 'solved';
        this.endGridCell.solved = true;
        this.solutionElement.innerHTML = this.word.strike();
    }
}

class Grid {

    constructor(rows, columns, onGameFinished) {
        this.rows = rows;
        this.columns = columns;
        this.lastStartCellClicked = null;
        this.lastEndCellClicked = null;
        this.grid = createNArray(rows, columns);
        this.gridSize = rows * columns;
        this.wordHolders = [];
        this.generateGrid(rows, columns)
        this.solveCount = 0;
        this.onGameFinished = onGameFinished;
    }

    validateOnEndCellSelected() {

        let solved = false;
        for(let i = 0; i < this.wordHolders.length; i++) {

            let wordHolder = this.wordHolders[i];

            if(wordHolder.solved) continue;

            if(wordHolder.startGridCell !== this.lastStartCellClicked || wordHolder.endGridCell !== this.lastEndCellClicked)
                continue;
            solved = true;
            wordHolder.handleOnSolvedWord();
            break;
        }

        if(!solved){
            this.lastStartCellClicked.cellElement.className = this.lastStartCellClicked.solved ? 'solved' : '';
            this.lastEndCellClicked.cellElement.className = this.lastEndCellClicked.solved ? 'solved' : '';
        }else{
            this.solveCount++;
            if(this.solveCount === this.wordHolders.length) {
                this.onGameFinished();
            }
        }

        this.lastStartCellClicked = null;
        this.lastEndCellClicked = null;
    }

    generateGrid(rows, columns) {
        let grid = document.createElement('table');
        grid.id = 'word-search-table';
        grid.className = 'grid';
        for (let row = 0; row < rows; ++row) {

            let rowElement = grid.appendChild(document.createElement('tr'));

            for (let column = 0; column < columns; ++column) {

                let cellElement = rowElement.appendChild(document.createElement('td'));
                cellElement.style.userSelect = 'none';
                cellElement.addEventListener('click', function(e){

                    if(e.shiftKey && this.lastStartCellClicked) {
                        gridCell.cellElement.className = 'end-cell';
                        this.lastEndCellClicked = gridCell;

                        this.validateOnEndCellSelected();

                    }else {

                        // Reset if user clicks on the already selected start cell.
                        if(this.lastStartCellClicked && this.lastStartCellClicked === gridCell) {
                            this.lastStartCellClicked.cellElement.className = this.lastStartCellClicked.solved ? 'solved' : '';
                            this.leftClickStartCell = null;

                            // If there was an end click cell
                            if(this.lastEndCellClicked) {

                                this.lastEndCellClicked.cellElement.className = this.lastEndCellClicked.solved ? 'solved' : '';
                                this.lastEndCellClicked = null;
                            }

                            return;
                        }
                        else if (this.lastStartCellClicked) {
                            this.lastStartCellClicked.cellElement.className = this.lastStartCellClicked.solved ? 'solved' : '';
                        }
                        gridCell.cellElement.className = 'start-cell';
                        this.lastStartCellClicked = gridCell;
                    }

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
        grid.wordHolders = [];
        grid.resetGrid();
        solutions = [];

        let cellsFilled = 0;
        let target = words.join().replace(/,/g, "").length;

        for(let word of words) {

            cellsFilled += tryPlaceWord(grid, word);

            if(cellsFilled === target) {
                return true;
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

    let startCell = null;
    let endCell = null;
    let betweenCells = [];
    for(index = 0, rowCheck = row, columnCheck = column; index < length; index++) {

        if(grid.grid[rowCheck][columnCheck].character === word[index]){
            overlaps++;
        }
        else{
            grid.grid[rowCheck][columnCheck].setCharacter(word[index]);
        }

        if(index === 0)
            startCell = grid.grid[rowCheck][columnCheck]
        else if (index === length - 1)
            endCell = grid.grid[rowCheck][columnCheck]
        else
            betweenCells.push(grid.grid[rowCheck][columnCheck])


        if(index < length - 1) {

            columnCheck += directions[direction][0];
            rowCheck += directions[direction][1];
        }
    }

    let lettersPlaced = length - overlaps;

    if(lettersPlaced > 0)
    {
        const solution = `(First: ${column},${row})(Last: ${columnCheck},${rowCheck})`;

        const wordHolder = new WordHolder(word, startCell, endCell, betweenCells, solution);
        grid.wordHolders.push(wordHolder);
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

// Fisher Yates Shuffle
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


function sortWordHolders(holderA, holderB) {

    if(holderA.word > holderB.word)
        return 1;
    if(holderA.word < holderB.word)
        return -1;
    return 0;
}

export function generateWordSearch(words, rows, columns, onGameFinished) {
    const grid = new Grid(rows, columns, onGameFinished);

    createWordSearch(words, grid);

    fillRemainingCells(grid);

    const solutionsListing = document.createElement('ol');
    solutionsListing.id = 'solutions';
    solutionsListing.style.color = 'white';

    let sortedWords = grid.wordHolders.sort(sortWordHolders);

    for(let i = 0; i < sortedWords.length; i++) {
        solutionsListing.appendChild(sortedWords[i].solutionElement);
    }

    return [grid, solutionsListing];
}
