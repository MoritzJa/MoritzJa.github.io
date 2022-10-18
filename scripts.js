selector_index = 0;
for (el of document.getElementById("scroll-projects").children) {
    temp = document.getElementById("selector-projects").innerHTML;
    temp = temp + "<div id='selector-" + selector_index + "-projects' class='selector-button project-button' onclick = 'show_project(this, "+ el.id +")'>" + selector_index + "</div>";
    document.getElementById("selector-projects").innerHTML = temp;

    grid_temp = document.getElementById("selector-projects").style.gridTemplateColumns;
    grid_temp = grid_temp + " 1fr";
    document.getElementById("selector-projects").style.gridTemplateColumns = grid_temp;

    selector_index++;
}

document.getElementById("selector-0-projects").style.borderBottom = "none";
show_project(document.getElementById("selector-0-projects"), document.getElementById("p1"))



function show_project(element, project) {
    for (el of document.getElementsByClassName("project-button")) {
        el.style.borderBottom = "solid";
    }

    element.style.borderBottom = "none";

    for (el of document.getElementById("scroll-projects").children) {
        el.style.display = "none";
    }

    project.style.display = "block";
}



selector_index = 0;
for (el of document.getElementById("scroll-work").children) {
    temp = document.getElementById("selector-work").innerHTML;
    temp = temp + "<div id='selector-" + selector_index + "-work' class='selector-button work-button' onclick = 'show_work(this, "+ el.id +")'>" + selector_index + "</div>";
    document.getElementById("selector-work").innerHTML = temp;

    grid_temp = document.getElementById("selector-work").style.gridTemplateColumns;
    grid_temp = grid_temp + " 1fr";
    document.getElementById("selector-work").style.gridTemplateColumns = grid_temp;

    selector_index++;
}

document.getElementById("selector-0-work").style.borderBottom = "none";
show_work(document.getElementById("selector-0-work"), document.getElementById("w1"))


function show_work(element, work) {
    for (el of document.getElementsByClassName("work-button")) {
        el.style.borderBottom = "solid";
    }

    element.style.borderBottom = "none";

    for (el of document.getElementById("scroll-work").children) {
        el.style.display = "none";
    }

    work.style.display = "block";
}

//Attractor code
//variables
a = -1.18;
b = 3.40;
c = -4.86;
d = -3.31;

var canvas = document.querySelector('#myCanvas');
var context = canvas.getContext('2d', {willReadFrequently: true});
context.canvas.width = 500;
context.canvas.height = 500;

time = 10000
let start_time;

it_per_frame = 1000;

width = canvas.width;
canvas.height = width;
height = canvas.height;

start_x = 0;
start_y = 0;

x = start_x;
y = start_y;

shift_x = width/2;
shift_y = height/2;

scale = width / 4;

var stop = false;

let done = false

function drawPixel(x, y, a) {

  var roundedX = Math.round(x);
  var roundedY = Math.round(y);

  const pixel = context.getImageData(roundedX, roundedY, 1, 1);
  const data = pixel.data;

  const alpha = data[3] / 255;

  const rgba = `rgba(${255}, ${255}, ${255}, ${alpha + a})`;
  context.fillStyle = rgba || '#000';
  context.fillRect(roundedX, roundedY, 1, 1);
}

function iterate() {
  x_old = x;
  y_old = y;
  x = Math.sin(a * y_old) - Math.cos(b * x_old);
  y = Math.sin(c * x_old) - Math.cos(d * y_old);
}

function step(timestamp) {
  if (start_time === undefined) {
    start_time = timestamp;
  }

  const elapsed = timestamp - start_time;

  if (elapsed < time) {
    for (let i = 0; i < it_per_frame; i++) {
      iterate();
      drawPixel(x * scale + shift_x, y * scale + shift_y, 0.002);
    }
    anim = window.requestAnimationFrame(step);
  }
}

text = document.getElementById("canvtext")
text.innerHTML = (`a=${a.toFixed(1)} b=${b.toFixed(1)} c=${c.toFixed(1)} d=${d.toFixed(1)}`)

anim = window.requestAnimationFrame(step);

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function restart() {
	window.cancelAnimationFrame(anim);
	context.clearRect(0, 0, canvas.width, canvas.height);
	//modify start params
	x = start_x;
	y = start_y;
	a = getRandomArbitrary(-10, 10);
	b = getRandomArbitrary(-10, 10);
	c = getRandomArbitrary(-10, 10);
	d = getRandomArbitrary(-10, 10);
	start_time = undefined;
	
	text.innerHTML = (`a=${a.toFixed(1)} b=${b.toFixed(1)} c=${c.toFixed(1)} d=${d.toFixed(1)}`)
	
	//start again
    anim = window.requestAnimationFrame(step);
}