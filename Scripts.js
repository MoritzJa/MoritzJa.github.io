function flipME(event){
	var element = event.currentTarget;
	if (element.className === "ME-inner") {
		if(element.style.transform == "rotateY(180deg)") {
		element.style.transform = "rotateY(0deg)";
    }
    else {
      element.style.transform = "rotateY(180deg)";
    }
  }
};

function flipT(event){
	var element = event.currentTarget;
	if (element.className === "T-inner") {
		if(element.style["transform"] == "rotate3d(1, -1, 0, 180deg)") {
		element.style["transform"] = "rotate3d(1,-1, 0,0deg)";
    }
    else {
      element.style["transform"] = "rotate3d(1,-1, 0,180deg)";
    }
  }
};

function flipC(event){
	var element = event.currentTarget;
	if (element.className === "C-inner") {
		if(element.style["transform"] == "rotate3d(1, 1, 0, 180deg)") {
		element.style["transform"] = "rotate3d(1,1, 0,0deg)";
    }
    else {
      element.style["transform"] = "rotate3d(1,1, 0,180deg)";
    }
  }
};