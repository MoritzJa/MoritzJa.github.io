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

    if (id == "Step3") {
        var all = document.getElementsByClassName('inner_analyze');
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

        var all = document.getElementsByClassName('inner_analyze');
        for (var i = 0; i < all.length; i++) {
            all[i].style.display = "none";
        }
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
        const original = document.getElementById("canvasInput");

        var v_width = 0;
        var v_height = 0;

        var min_res = null;
        var s_x = null;
        var s_y = null;

        function draw() {
            canvas.width = 400;
            canvas.height = 400;
            canvas.getContext('2d').drawImage(video, s_x, s_y, min_res, min_res, 0, 0, canvas.width, canvas.height);
            original.width = min_res;
            original.height = min_res;
            original.getContext('2d').drawImage(video, s_x, s_y, min_res, min_res, 0, 0, min_res, min_res);
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
	        video: {facingMode: 'environment',
                    width: { ideal: 2000 },
                    height: { ideal: 2000 }}
        }

        mediaStream =  await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = mediaStream;
    }

    else {
        alert("Your brwoser doesnt support UserMedia")
    }
}

function close_stream () {
    var stream = document.getElementById("input_video").srcObject;

    stream.getTracks().forEach(function(track) {
        track.stop();
      });
}

function analyze_template() {
    var valid = false;

    let src = cv.imread("canvasOutput");
    let dst = new cv.Mat();
    let circles = new cv.Mat();

    let low = new cv.Mat(src.rows, src.cols, src.type(), [100, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [255, 100, 100, 255]);

    cv.inRange(src, low, high, dst);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    cv.erode(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 50, 10, 10, 0, 50);

    cv.imshow("canvasOutput", dst)

    const centres = [];

    for (let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);
        centres.push(center);
        var can = document.getElementById("canvasOutput").getContext('2d')
        can.fillStyle = "rgb(0,255,0)";
        can.beginPath();
        can.arc(x, y, radius, 0, 2 * Math.PI);
        can.fill();
    }

    document.getElementById("Step2_h").innerHTML = centres.length;

    if (centres.length == 4) {
        var distances = [];

        for (let i = 0; i < centres.length; i++) {
            for (let j = i+1; j < centres.length; j++) {
                distances.push(Math.sqrt(((centres[j].x - centres[i].x)*(centres[j].x - centres[i].x)) + ((centres[j].y - centres[i].y)*(centres[j].y - centres[i].y))));
            }
        }

        distances = distances.sort(function(a, b) {
        return a - b;
        });

        distances = distances.splice(0, 4);

        var avg_dist = 0;

        for (const item of distances) {
            avg_dist = avg_dist + item;
        }

        avg_dist = avg_dist / distances.length;

        var deviation = 0;
        for (let i = 0; i < distances.length; i++) {
            deviation = deviation + Math.abs(distances[i]-avg_dist);
        }
        deviation = deviation / distances.length;
        document.getElementById("image_feedback").innerHTML = Math.round(deviation);
        if (deviation < 20) {
            valid = true;
        }
        else {
            valid = false;
        }
    }

    var use = document.getElementById("use_image");
    if (valid) {
        use.style.display = "inline";
        document.getElementById("canvasOutput").style.borderColor = "rgb(0,255,0)"
    }
    else {
        use.style.display = "none";
        document.getElementById("canvasOutput").style.borderColor = "rgb(255,0,0)"
    }

    src.delete(); dst.delete(); low.delete(); high.delete();

}

function use_image() {
    clearInterval(interval);
    close_stream();
    reset_menu("Step2_reset");
    test("Step3");

    input = document.getElementById("canvasInput");
    output = document.getElementById("base_image");

    output.width = input.width;
    output.height = input.height;
    output.getContext('2d').drawImage(input, 0, 0);

    let src = cv.imread("canvasInput");
    let dst = new cv.Mat();
    let circles = new cv.Mat();

    let low = new cv.Mat(src.rows, src.cols, src.type(), [100, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [255, 100, 100, 255]);

    cv.inRange(src, low, high, dst);

    cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 50, 10, 10, 0, 200);

    const centres = [];

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

        let center = new cv.Point(x, y);
        centres.push(center);
    }
    output.getContext('2d').strokeRect(x_low+max_rad, y_low+max_rad, x_high-x_low-2*max_rad, y_high-y_low-2*max_rad);

    document.getElementById("Step3_h").innerHTML = centres.length;
}

var interval = null;
