
class PathData {

    constructor(id, text, title, choice1, choice2) {
        this.id = id;
        this.text = text;
        this.title = title;
        this.choice1 = choice1;
        this.choice2 = choice2;
    }
}

class PathNode {

    constructor(pathData){
        this.pathData = pathData;
        this.leftChild = null;
        this.rightChild = null;
    }

    setChildren(leftChild, rightChild){
        this.leftChild = leftChild;
        this.rightChild = rightChild;
    }
}

class PathTree {

    constructor(path){

        this.rootNode = null;
        this.pathNodes = this.generatePathFromData(path);

        this.currentPathNode = this.pathNodes[0];
    }

    generatePathFromData(file) {

        let request = new XMLHttpRequest();
        request.open('GET', file, false);
        request.send();

        let jsonData = JSON.parse(request.responseText);

        let paths = jsonData['paths'];
        let pathNodes = [];

        for(let i = 0; i < paths.length; i++){
            let pathData = new PathData(paths[i].id, paths[i].text, paths[i].title, paths[i].choices.choice1, paths[i].choices.choice2);
            pathNodes.push(new PathNode(pathData));
        }

        for(let i = 0; i < pathNodes.length; i++) {

            let leftIndex = pathNodes[i].pathData.choice1.id;
            let rightIndex = pathNodes[i].pathData.choice2.id;
            pathNodes[i].setChildren(this.getChild(pathNodes, leftIndex), this.getChild(pathNodes, rightIndex));
        }

        return pathNodes;
    }

    getChildBinarySearch(pathNodes, target, low, high) {

        let mid = Math.floor((low + high) / 2);

        if(low <= high) {
            if(pathNodes[mid].pathData.id === target)
                return pathNodes[mid];
            else if(target < pathNodes[mid].pathData.id)
                return this.getChildBinarySearch(pathNodes, target, low, mid - 1);
            else
                return this.getChildBinarySearch(pathNodes, target, mid + 1, high);
        }
        return -1;
    }

    getChild(pathNodes, childID) {
        return this.getChildBinarySearch(pathNodes, childID, 0, pathNodes.length - 1);
    }

    setNextNode(left) {

        if(this.currentPathNode.leftChild === -1 && this.currentPathNode.rightChild === -1)
            return -1;

        this.currentPathNode = left
            ? this.currentPathNode.leftChild
            : this.currentPathNode.rightChild;
    }

    getTitleText() {
        return this.currentPathNode.pathData.title;
    }

    getPathText() {
        return this.currentPathNode.pathData.text;
    }

    getChoice1Text() {
        return this.currentPathNode.pathData.choice1.text;
    }

    getChoice2Text() {
        return this.currentPathNode.pathData.choice2.text;
    }
}


const mainTextElement = document.getElementById('main-text');
const choice1Button = document.getElementById("choice1-button");
const choice2Button = document.getElementById("choice2-button");
const choice1Text = document.getElementById('choice1-text');
const choice2Text = document.getElementById('choice2-text');
const title = document.getElementById("paragraph-label");

choice1Button.addEventListener("click", function() {
    tree.setNextNode(true);

    displayNextPath();
});

choice2Button.addEventListener("click", function() {
    tree.setNextNode(false);

    displayNextPath();
});


function displayNextPath() {
    mainTextElement.innerHTML = tree.getPathText();
    choice1Text.innerHTML = tree.getChoice1Text();
    choice2Text.innerHTML  = tree.getChoice2Text();
    title.innerHTML = tree.getTitleText();
}


let tree = new PathTree('../assets/files/text_adventure.json');

displayNextPath();





