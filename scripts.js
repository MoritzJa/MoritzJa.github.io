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