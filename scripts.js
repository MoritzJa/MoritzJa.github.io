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

    if (i == "Step1") {
        zoomReset(i);
        zoomIn("Step2");
    }
    else if (i == "Step2") {
        if (valid && !camState) {
            zoomReset(i);
            analyse();
            zoomIn("Step3");
        }
    }
    else if (i == "Step3") {
        if (valid && !camState && done) {
            zoomReset(i);
            zoomIn("Step4");
            createChart();
        }
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

        if (valid) {
            document.getElementById("NextStep2").style.backgroundColor = "rgb(0,150,0)";
        }
        else {
            document.getElementById("NextStep2").style.backgroundColor = "rgb(150,0,0)";
        }

        camState = false;
    }
    else{
        document.getElementById("NextStep2").style.backgroundColor = "rgb(150,0,0)";

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
    done = false;
    valid = false;
    circles = cv.Mat.zeros(circles.rows, circles.cols, cv.CV_32FC3);

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

        avg_dist = 0;

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

        if (deviation < 20) {
            valid = true;
        }
    }

    //display final image
    cv.imshow('canvasOutputVideo', dst);

    if (valid && centres.length == 4){
        canvas.style.borderColor = "rgb(0,200,0)";
        feedback.style.borderColor = "rgb(0,200,0)";
        feedback.style.backgroundColor = "rgb(0,150,0)";
    }
    else {
        canvas.style.borderColor = "rgb(200,0,0)";
        feedback.style.borderColor = "rgb(200,0,0)";
        feedback.style.backgroundColor = "rgb(150,0,0)";
    }
}

function analyse() {
    done = false;
    var x_low = 100000;
    var x_high = -1;
    var y_low = 100000;
    var y_high = -1;
    var max_rad = -1;
    for (let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        
        if (x > x_high) {
            x_high = x;
        }
        if (x < x_low) {
            x_low = x;
        }
        if (y > y_high) {
            y_high = y;
        }
        if (y < y_low) {
            y_low = y;
        }
        if (radius > max_rad) {
            max_rad= radius;
        }
    }

    //calculate and mark measurement area
    min_width = Math.min(x_high-x_low, y_high-y_low);

    let roi = new cv.Rect(x_low+max_rad, y_low+max_rad, min_width, min_width);

    cropped = new cv.Mat(min_width, min_width, cv.CV_8UC4);
    croppedThresh = new cv.Mat(min_width, min_width, cv.CV_8UC4);
    let color = new cv.Scalar(0, 0, 0);
    let safety = 10;
    let lt = new cv.Point(x_low+max_rad+safety, y_low+max_rad+safety);
    let rb = new cv.Point(x_high-max_rad-safety, y_high-max_rad-safety);
    //cv.rectangle(src, lt, rb, color, 4);

    //crop into safe area
    var rect = new cv.Rect(x_low+max_rad+safety, y_low+max_rad+safety, min_width-2*max_rad-2*safety, min_width-2*max_rad-2*safety); 
    cropped = src.roi(rect);

    //grey image
    cv.cvtColor(cropped, croppedThresh, cv.COLOR_RGBA2GRAY, 0);

    //thresh image
    cv.threshold(croppedThresh, croppedThresh, 90, 255, cv.THRESH_BINARY_INV);

    //find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(croppedThresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_TC89_KCOS);

    //draw conrours
    cv.cvtColor(cropped, cropped, cv.COLOR_RGBA2RGB, 0);
    for (let i = 0; i < contours.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 200)+55, Math.round(Math.random() * 200)+55,
                                  Math.round(Math.random() * 200)+55);
        cv.drawContours(cropped, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }

    num_particles = contours.size();
    diameterList = [];
    var sum_avg_dia = 0;
    avg_dia = null;
    scaler = known_dist_mu / avg_dist;
    for (let i = 0; i < contours.size(); ++i) {
        let area = cv.contourArea(contours.get(i), false);
        let equiDiameter = Math.sqrt(4 * area / Math.PI);
        diameterList.push(equiDiameter * scaler);
        sum_avg_dia = sum_avg_dia + equiDiameter * scaler;
    }

    avg_dia = sum_avg_dia / num_particles;

    diameterList = diameterList.sort(function(a, b) {
        return a - b;
    });
    
    var half = Math.floor(diameterList.length / 2);

    if (diameterList.length % 2) {
        median_dia = diameterList[half];
    }
    else {
        median_dia = (diameterList[half - 1] + diameterList[half]) / 2.0;
    }

    for (const desc of descriptionAmount) {
        desc.innerHTML = "#: " + num_particles;
    }
    for (const desc of descriptionSize) {
        desc.innerHTML = "avg. size: " + Math.round(avg_dia);
    }
    descriptionSizeMedian.innerHTML = "med. size: " + Math.round(median_dia);
    done = true;
    //display final image
    cv.imshow('canvasFinalImage', cropped);
}

function createChart() {
    var labelList = []
    for (let i = 0; i <= 2000; i = i+100) {
        labelList.push(i);
    }

    labelList[0] = "<100"

    var buckets = []
    for (let i = 0; i < labelList.length; ++i) {
        var temp = 0;
        for (const part of diameterList) {
            if (part < 50 && i == 0) {
                temp = temp + 1;
            }
            else if (part > labelList[i]-50 && part < labelList[i]+50) {
                temp = temp + 1;
            }
        }
        buckets.push(temp);
    }
    for (var bkt of buckets) {
        bkt = bkt / num_particles;
    }

    fines = buckets.shift();
    fines = fines * 100;
    fines = Math.round(fines / num_particles);
    labelList.shift();

    descriptionFines.innerHTML = "% fines (<100mu): " + fines;

    const data = {
        labels: labelList,
        datasets: [{
          backgroundColor: 'rgb(23, 119, 128)',
          borderColor: 'rgb(23, 119, 128)',
          data: buckets,
        }]
    };

    const config = {
        type: 'bar',
        label: '% particles',
        data: data,
        options: {
            plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                    titleFont: {
                        family: 'Dongle',
                        size: 60,
                        weight: 'bold',
                        lineHeight: 1.2,
                    },
                    bodyFont: {
                        family: 'Dongle',
                        size: 60,
                        weight: 'bold',
                        lineHeight: 1.2,
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: 'Dongle',
                            size: 40,
                            weight: 'bold',
                            lineHeight: 1.2,
                          },
                    },
                    display: true,
                    title: {
                        display: true,
                        text: 'particle size in mu',
                        font: {
                            family: 'Dongle',
                            size: 40,
                            weight: 'bold',
                            lineHeight: 1.2,
                          },    
                    }
                },
                y: {
                    ticks: {
                        font: {
                            family: 'Dongle',
                            size: 40,
                            weight: 'bold',
                            lineHeight: 1.2,
                          },
                    },
                    display: true,
                    title: {
                        display: true,
                        text: 'percentage of distribution',
                        font: {
                            family: 'Dongle',
                            size: 40,
                            weight: 'bold',
                            lineHeight: 1.2,
                          },    
                    }
                }
            }
        }
    };
    if (myChart != null) {
        myChart.destroy();
    }
    myChart = new Chart(document.getElementById('myChart'), config);
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
const descriptionSize = document.getElementsByClassName("imageDescriptionSize");
const descriptionSizeMedian = document.getElementById("imageDescriptionSizeMedian2");
const descriptionAmount = document.getElementsByClassName("imageDescriptionAmount");
const descriptionFines = document.getElementById("imageDescriptionFines2");

var cap = null;

canvas.width = 2000;
canvas.height = 2000;

var org = null;
var src = null;
var dst = null;
var cropped = null;
var croppedThresh = null;

let circles = new cv.Mat();

var avg_dist = null;
const known_dist_mu = 150000;
var scaler = null;

let low = null;
let high = null;

var valid = false;

var done = false;

var diameterList = null;
var num_particles = null;
var avg_dia = null;
var median_dia = null;

var myChart = null;

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