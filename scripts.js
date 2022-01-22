function test(id) {
    var elem = document.getElementById(id)
    elem.style.width = "min(100vh, 100vw)"
    elem.style.height = "min(100vh, 100vw)"
    elem.style.gridColumn = "1/3"
    elem.style.gridRow = "1/3"
    elem.style.zIndex = "1"

    var reset = document.getElementById(id+"_reset")
    reset.style.display = "inline"

    if (id == "Step2") {
        var all = document.getElementsByClassName('inner_image_upload');
        for (var i = 0; i < all.length; i++) {
            all[i].style.display = "inline";
        }
    }
}

function reset_menu(id) {
    var elem = document.getElementById(id).parentElement
    elem.style.width = "min(50vh, 50vw)"
    elem.style.height = "min(50vh, 50vw)"
    elem.style.zIndex = "auto"

    var res = document.getElementById(id)
    res.style.display = "none"

    if (id == "Step1_reset") {
        elem.style.gridColumn = "1"
        elem.style.gridRow = "1"
    }

    if (id == "Step2_reset") {
        elem.style.gridColumn = "2"
        elem.style.gridRow = "1"

        var all = document.getElementsByClassName('inner_image_upload');
        for (var i = 0; i < all.length; i++) {
            all[i].style.display = "none";
        }
    }

    if (id == "Step3_reset") {
        elem.style.gridColumn = "1"
        elem.style.gridRow = "2"
    }

    if (id == "Step4_reset") {
        elem.style.gridColumn = "2"
        elem.style.gridRow = "2"
    }
}

function load_image(id) {
    let image = document.getElementById("input_img")
    let file = document.getElementById(id)
    image.src = URL.createObjectURL(file.files[0])
}

function set_image_reset_cam() {
    clearInterval(interval);
    let image = document.getElementById("input_img")

    image.onload = function() {
        let mat = cv.imread(image);
        cv.imshow('canvasOutput', mat);
        mat.delete();
    }

    if(image.complete && image.naturalHeight !== 0) {
        let mat = cv.imread(image);
        cv.imshow('canvasOutput', mat);
        mat.delete();
    }
}

async function access_camera(id) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const video = document.getElementById("input_video");
        const canvas = document.getElementById("canvasOutput");

        var v_width = 0;
        var v_height = 0;

        var min_res = null;
        var s_x = null;
        var s_y = null;

        function draw() {
            canvas.width = min_res;
            canvas.height = min_res;
            canvas.getContext('2d').drawImage(video, s_x, s_y, min_res, min_res, 0, 0, min_res, min_res);
            if(canvas.width != 0) {
                analyze_template();
            }
        }

        interval = setInterval(draw, 1000/60);

        video.addEventListener( "loadedmetadata", function (e) {
            v_width = this.videoWidth;
            v_height = this.videoHeight;
            min_res = Math.min(v_width, v_height);
            s_x = v_width / 2 - min_res / 2 ;
            s_y = v_height / 2 - min_res / 2 ;
            video.play();
        }, false );

        const constraints = {
            audio: false, 
	        video: {facingMode: 'environment'}
        }

        mediaStream =  await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = mediaStream;
    }

    else {
        alert("Your brwoser doesnt support UserMedia")
    }
}

function analyze_template() {
    let src = cv.imread("canvasOutput");
    let dst = new cv.Mat();
    let circles = new cv.Mat();

    let low = new cv.Mat(src.rows, src.cols, src.type(), [150, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [255, 100, 100, 255]);

    cv.inRange(src, low, high, dst);

    cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 20, 10, 10, 0, 200);

    document.getElementById("Step2_h").innerHTML = circles.cols;

    cv.imshow("canvasOutput", dst)

    src.delete(); dst.delete(); low.delete(); high.delete();

}

var interval = null;
