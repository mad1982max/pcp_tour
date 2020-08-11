let header, footer, container;
let level, floorSrc, coverSrc, headerFooterHeight, wHeight, wWidth, cover, set, svg, svgHeight, floorLayer, mainLayer;
let zoom;
let setFlagObj = {};
let currentRatioImgData = {
    zoom: {
        x: 0,
        y: 0,
        k: 1
    },
    x: 0,
    y: 0,
    initPicWidth: 3000,
    initPicH: 1850,
    k: 0
}
let oldScale = 1;
let clusterInitObj = [ 150, 75, 0 ];
let setsToShow = [];
let pointsOnLevel;

window.onload = onloadFn;

function defineData4Floor() {
    let paramsString = window.location.search;
    let searchParams = new URLSearchParams(paramsString);
    level = searchParams.get("level");
    floorSrc = `./img/${level}.png`;
    pointsOnLevel = points.filter(point => point.level === level);
}

function onloadFn() {
    defineData4Floor();
    header = document.querySelector(".header");
    footer = document.querySelector(".footer");
    container = document.getElementById("container");
    window.addEventListener("resize", resize);
    buildSvg();
    resize();
    document.body.style.opacity = 1;
}

function getScreenWidthHeight() {
    headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    svgHeight = wHeight - headerFooterHeight;
}


function resize() {
    getScreenWidthHeight();

    if (wWidth > svgHeight * currentRatioImgData.initPicWidth / currentRatioImgData.initPicH) {
        currentRatioImgData.k = svgHeight / currentRatioImgData.initPicH;
        currentRatioImgData.x = (wWidth / currentRatioImgData.k - currentRatioImgData.initPicWidth) / 2;
        currentRatioImgData.y = 0;
    } else {
        currentRatioImgData.k = wWidth / currentRatioImgData.initPicWidth;
        currentRatioImgData.x = 0;
        currentRatioImgData.y = (wHeight / currentRatioImgData.k - currentRatioImgData.initPicH) / 5;
    }
    container.style.height = `${svgHeight}px`;
    container.style.width = `${wWidth}px`;

    centerizeFn();

    // if (mainLayer) {
    //     mainLayer
    //         .attr("transform", `translate(${currentRatioImgData.zoom.x},${currentRatioImgData.zoom.y}) scale(${currentRatioImgData.k*currentRatioImgData.zoom.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`);
    // }
}

function buildSvg() {

    svg = d3.select("#container").append("svg");
    svg
        .attr("class", "svgContainer")
        .attr("height", "100%")
        .attr("width", "100%");

    mainLayer = svg.append("g");
    mainLayer
        .attr("class", "mainLayer")
        .attr("opacity", "0")
        .attr("transform", `scale(${currentRatioImgData.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`)
    

    floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
    let floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("xlink:href", floorSrc);
    floor.on("load", () => {
        let pointsOnLevelCopy = pointsOnLevel.slice();
        let currentSet = clusterize(pointsOnLevelCopy, clusterInitObj[0]);
        drawSet('all', currentSet, 'big');
    });
    
    mainLayer
        .transition()
        .duration(700)
        .attr("opacity", "1");        

    zoom = d3
        .zoom()
        .scaleExtent([0.3, 10])
        .on("zoom", () => {
            zoomed();
            rebuildClusters();
        })
        .on("start", () => {
        })
        .on("end", () => {
        });
    svg.call(zoom);
}

function rebuildClusters () {    
    let scale = d3.zoomTransform(svg.node()).k;
    console.log(scale, oldScale);
    if(scale.toFixed(1) === oldScale.toFixed(1)) return;
    oldScale = scale;

    let pointsOnLevelCopy = pointsOnLevel.slice();
    if (scale < 1.7) {
        deleteSet('svg', '.set');
        let currentSet = clusterize(pointsOnLevelCopy, clusterInitObj[0]);
        drawSet('all', currentSet, 'big');
        return;
    }
    
    if(scale > 1.7 && scale < 2.3) {
        deleteSet('svg', '.set');
        let currentSet = clusterize(pointsOnLevelCopy, clusterInitObj[1]);
        drawSet('all', currentSet, 'big');
        return;
    }
    if(scale > 2.3) {
        deleteSet('svg', '.set');
        let currentSet = clusterize(pointsOnLevelCopy, clusterInitObj[2]);
        drawSet('all', currentSet, 'small');
    }     
}


function drawSet(itemToShow, currentSet, sizePoint = "big", isChecked = true) {

    if (isChecked) {
        set = mainLayer.append("g")
        set.attr("class", `set ${itemToShow}`)
            .selectAll("g")        
            .data(currentSet)
            .join("g")
            .attr("pointer-events", "visible")
            .attr("cursor", "pointer")
            .attr("id", d => d.name)
            .append("circle")
                .attr("fill", d => d.points.length > 1 ? "#00BD63" : "#FF2A2A")
                .attr("cx", d => d.centroid.x)
                .attr("cy", d => d.centroid.y + 165)
                .attr("r", d =>d.points.length > 1 ? 35 : sizePoint === "big" ? 25 : 13)
                .on("click", clickedOnPin);

        set
            .selectAll("g")
            .data(currentSet)
            .join("g")
            .append("text")
            .attr("x", d => {
                return d.centroid.x;
            })
            .attr("y", d => d.centroid.y + 168)
            .attr("text-anchor", "middle")
            .attr("font-size", d => d.points.length > 1 ? 45 : sizePoint === "big" ? 20 : 8)
            .attr("fill", "white")
            .attr("font-family", "sans-serif")
            .attr("dy", d => d.points.length > 1 ? "12": sizePoint === "big" ? "4" : "-1")
            .attr("dx", "-0")
            .attr("pointer-events", "none")
            .text(d => d.points.length > 1 ? d.points.length: d.points[0].name);
    } else {
        let current = svg.select(`.${itemToShow}`);
        if (current) current.remove();
    }
}

function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector)
    } else if(base === "svg") {
        element = svg.select(selector);
    }    
    if (element) element.remove();
}

function clickedOnPin(d) {
    let points = d.points;
    if(points.length === 1) {
        let {name, phase} = points[0];
        window.open("../PANOS/mainPointCloud.html?level=" + level + "&name=" + name + "&phase=" + phase, "_self");
    } else {
        console.log('too much')
    }
};

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(0,0).scale(1));
}

function drawCover(itemToShow, isChecked) {
    console.log("cover to build:", itemToShow, isChecked);
    if (isChecked) {
        cover = floorLayer.insert("image", ":first-child");
        cover.attr("xlink:href", coverSrc.src)
    } else {
        if (cover) cover.remove();
    }
}

function zoomed() {
    let {
        k,
        x,
        y
    } = d3.event.transform;

    let transform2 = d3Transform()
        .translate([x, y])
        .scale(k * currentRatioImgData.k)
        .translate([currentRatioImgData.x, currentRatioImgData.y])
    mainLayer.attr("transform", transform2);

    currentRatioImgData.zoom = {
        x,
        y,
        k
    };
}

//checkbox disabled
// function checkBoxListener(itemToShow, isChecked) {
//     switch (itemToShow) {
//         case "cover":
//             drawCover(itemToShow, isChecked);
//             break;
//         case "PHASE1":
//         case "PHASE2":
//             drawSet(itemToShow, isChecked);
//             break;
//         default:
//             console.log("--nothing to draw");
//     }
// }

//let currentSet = pointsOnLevel.filter(point => itemToShow === "all" ? true : point.phase === itemToShow);

//checkbox disabled
// let checkBoxArr = [...document.querySelectorAll(".form-check-input")];
// checkBoxArr.forEach(box => {
//     setFlagObj[box.id] = box.checked;
//     box.addEventListener("change", (e) => checkBoxListener(e.target.id, e.target.checked))
//     checkBoxListener(box.id, box.checked);
// });