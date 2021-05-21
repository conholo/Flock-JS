let musicElement = document.getElementById("source_music");
let playButton = document.getElementById("play-button");

let initialized = false;
let isPlaying = false;

let width, height;
let heightOfBar;
let bufferLength, data, analyser;
let ctx1, ctx2, canvas_one, canvas_two;


playButton.onclick = function() {

    if(initialized){
        if(isPlaying) {
            musicElement.pause();
        }else{
            musicElement.play();
            draw();
        }

        isPlaying = !isPlaying;
        return;
    }

    let context = new AudioContext();
    let audioSource = context.createMediaElementSource(musicElement);
    analyser = context.createAnalyser();

    canvas_one = document.getElementById("visualizer");
    canvas_two = document.getElementById("visualizer2");

    width = window.innerWidth / 2;
    height = window.innerHeight / 2;

    canvas_one.width = width;
    canvas_two.width = width;
    canvas_one.height = height;
    canvas_two.height = height;

    ctx1 = canvas_one.getContext("2d");
    ctx2 = canvas_two.getContext("2d");

    audioSource.connect(analyser);
    analyser.connect(context.destination);

    analyser.fftSize = 128;

    bufferLength = analyser.frequencyBinCount;

    data = new Uint8Array(bufferLength);

    heightOfBar = (canvas_one.height / bufferLength) * 2;

    initialized = true;
    isPlaying = true;

    function draw() {
        requestAnimationFrame(draw);

        let y = heightOfBar;

        analyser.getByteFrequencyData(data);
        ctx1.clearRect(0, 0, ctx1.canvas.width, ctx1.canvas.height);
        ctx2.clearRect(0, 0, ctx1.canvas.width, ctx1.canvas.height);

        for(let i = 0; i < bufferLength; i++) {
            let barWidth = data[i];

            ctx1.fillStyle = "rgb(" + (barWidth + (30 * (i / bufferLength))) + "," + 250 * ( i / bufferLength) + "," + 255 + ", 0.5)";
            ctx2.fillStyle = "rgb(" + (barWidth + (30 * (i / bufferLength))) + "," + 250 * ( i / bufferLength) + "," + 255 + ", 0.5)";
            ctx1.fillRect(canvas_one.width - barWidth, y, barWidth, heightOfBar);
            ctx2.fillRect(0, y, barWidth, heightOfBar);

            y += heightOfBar + 1;
        }
    }

    musicElement.play();
    draw();
};