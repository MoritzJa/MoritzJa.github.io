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

    //erode
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    cv.erode(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    //detect circles
    let circles = new cv.Mat();
    cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 8, 1000, 10, 15, 25, 100);

    //draw circles
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGB);
    const centres = [];
    let color = new cv.Scalar(0, 255, 0);
    for (let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);
        centres.push(center);
        cv.circle(dst, center, radius, color, -1);
    }
    document.getElementById("Step2Title").innerHTML = centres.length;

    //only proceed if 4 centres are found
    if (centres.length == 4) {
        var distances = [];

        //calculate all 6 distances
        for (let i = 0; i < centres.length; i++) {
            for (let j = i+1; j < centres.length; j++) {
                distances.push(Math.sqrt(((centres[j].x - centres[i].x)*(centres[j].x - centres[i].x)) + ((centres[j].y - centres[i].y)*(centres[j].y - centres[i].y))));
            }
        }

        //sort distances
        distances = distances.sort(function(a, b) {
        return a - b;
        });

        //remove the two longest distances (they are the diagonals)
        distances = distances.splice(0, 4);

        var avg_dist = 0;

        for (const item of distances) {
            avg_dist = avg_dist + item;
        }

        //calculate tge average distance
        avg_dist = avg_dist / distances.length;

        //calucalte average absolute deviation of distances as measure for rotation
        var deviation = 0;
        for (let i = 0; i < distances.length; i++) {
            deviation = deviation + Math.abs(distances[i]-avg_dist);
        }
        deviation = deviation / distances.length;
        feedback.innerHTML = "deviation: " + Math.round(deviation);
    }

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

const feedback = document.getElementById("imageFeedback");

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