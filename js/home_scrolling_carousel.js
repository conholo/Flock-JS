
let currentImageIndex = 0;
let images = document.getElementsByClassName('slide-show-item');
for(let i = 1; i < images.length; i++){
    images[i].style.display = 'none';
}
let playAnimation = setInterval(animateImages, 2000);


let slideShowContainer = document.getElementById('main-slide-show-container');

slideShowContainer.addEventListener('mouseover', function() {
    clearInterval(playAnimation);
});

slideShowContainer.addEventListener('mouseleave', function(){
    playAnimation = setInterval(animateImages, 2000);
});


let previousButton = document.getElementById('previous-button');
let nextButton = document.getElementById('next-button');

previousButton.addEventListener('click', function() {
    currentImageIndex--;
    currentImageIndex = currentImageIndex < 0 ? images.length - 1: currentImageIndex;

    for (let i = 0; i < images.length; i++) {
        images[i].style.display = 'none';
    }

    images[currentImageIndex].style.display = 'block';
});


nextButton.addEventListener('click', function() {
    currentImageIndex++;
    currentImageIndex = currentImageIndex > images.length - 1 ? 0: currentImageIndex;

    for (let i = 0; i < images.length; i++) {
        images[i].style.display = 'none';
    }

    images[currentImageIndex].style.display = 'block';
});

function animateImages() {

    for (let i = 0; i < images.length; i++) {
        images[i].style.display = 'none';
    }

    currentImageIndex++;
    if(currentImageIndex > images.length - 1)
        currentImageIndex = 0;

    images[currentImageIndex].style.display = 'block';
}



