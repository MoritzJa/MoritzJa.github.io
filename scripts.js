function zoomIn(id) {
    var elem = document.getElementById(id);

    elem.style.width = "min(100vh, 100vw)";
    elem.style.height = "min(100vh, 100vw)";
    elem.style.gridColumn = "1/3";
    elem.style.gridRow = "1/3";
    elem.style.zIndex = "1";

    var all = document.getElementsByClassName(id+'Content');
    for (var i = 0; i < all.length; i++) {
        if (all[i].classList.contains("Button")) {
            all[i].style.display = "flex";
        }
        else {
            all[i].style.display = "inline";
        }
    }
}

function zoomReset(id) {
    var elem = document.getElementById(id);

    elem.style.width = "min(50vh, 50vw)";
    elem.style.height = "min(50vh, 50vw)";

    elem.style.zIndex = "auto"

    if (id == "Step1") {
        elem.style.gridColumn = "1";
        elem.style.gridRow = "1";
    }
    else if (id == "Step2") {
        elem.style.gridColumn = "2";
        elem.style.gridRow = "1";
    }
    else if (id == "Step3") {
        elem.style.gridColumn = "1";
        elem.style.gridRow = "2";
    }
    else if (id == "Step4") {
        elem.style.gridColumn = "2";
        elem.style.gridRow = "2";
    }

    var all = document.getElementsByClassName(id+'Content');
    for (var i = 0; i < all.length; i++) {
        all[i].style.display = "none";
    }
}

function menu(id) {
    zoomReset(document.getElementById(id).parentElement.id);
}

function next(id) {
    var i = document.getElementById(id).parentElement.id;
    zoomReset(i);

    if (i == "Step1") {
        zoomIn("Step2")
    }
    else if (i == "Step2") {
        zoomIn("Step3")
    }
    else if (i == "Step3") {
        zoomIn("Step4")
    }
}

async function startCameraAndCapture(id) {
    button = document.getElementById("startCamera");

    if (camState) {
        clearInterval(interval);
        button.innerHTML = "start camera";

        var stream = video.srcObject;
        stream.getTracks().forEach(function(track) {
            track.stop();
          });

        camState = false;
    }
    else{
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const constraints = {
                audio: false, 
                video: {facingMode: 'environment',
                        width: { ideal: 2000 },
                        height: { ideal: 2000 }}
            }

            camState = true;

            mediaStream =  await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = mediaStream;
            
            button.innerHTML = "capture";
        }
        else {
            alert("Your brwoser doesnt support UserMedia")
        }
    }
}

function captureAndDraw() {
    //read in from video stream
    cap.read(org);

    //crop into quadratic captured image
    let rect = new cv.Rect(s_x, s_y, min_res, min_res);
    src = org.roi(rect);

    //filter colors
    cv.inRange(src, low, high, dst);

    //display final image
    cv.imshow('canvasOutputVideo', dst);
}

var camState = false;
var interval = null;

s_x = null;
s_y = null;
min_res = null;

const video = document.getElementById("inputVideo");
const original = document.getElementById("Input");
const canvas = document.getElementById("canvasOutputVideo");

var cap = null;

canvas.width = 2000;
canvas.height = 2000;

var org = null;
var src = null;
var dst = null;

let low = null;
let high = null;

video.addEventListener("loadedmetadata", function (e) {
    video.play();

    v_width = this.videoWidth;
    v_height = this.videoHeight;
    this.width = this.videoWidth;
    this.height =this.videoHeight;

    min_res = Math.min(v_width, v_height);
    s_x = v_width / 2 - min_res / 2 ;
    s_y = v_height / 2 - min_res / 2 ;

    original.width = min_res;
    original.height = min_res;

    org = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    src = new cv.Mat(min_res, min_res, cv.CV_8UC4)
    dst = new cv.Mat(min_res, min_res, cv.CV_8UC4)
    low = new cv.Mat(src.rows, src.cols, src.type(), [80, 0, 0, 0]);
    high = new cv.Mat(src.rows, src.cols, src.type(), [255, 100, 100, 255]);
    
    cap = new cv.VideoCapture(this);
    interval = setInterval(captureAndDraw, 1000/60);
}, false );