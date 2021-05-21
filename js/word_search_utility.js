

export function generate_words(file) {

    const word_lengths = {
        "very small": [],
        "small": [],
        "medium": [],
        "long": []
    }

    let request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.send();

    let wordsText = request.responseText.split(',');
    for(let word of wordsText) {

        if(word.length <= 5){
            word_lengths['very small'].push(word);
        }
        else if(word.length > 5 && word.length <= 8){
            word_lengths['small'].push(word);
        }
        else if(word.length > 8 && word.length <= 11){
            word_lengths['medium'].push(word);
        }
        else {
            word_lengths['long'].push(word);
        }
    }

    return word_lengths;
}
