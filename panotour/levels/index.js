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
let clusterInitObj = [200, 120, 0];
let setsToShow = [];
let pointsOnLevel, currentSet_0, currentSet_1, currentSet_2;

window.onload = onloadFn;

function defineData4Floor() {
    let paramsString = window.location.search;
    let searchParams = new URLSearchParams(paramsString);
    level = searchParams.get("level");
    floorSrc = `./img/${level}.png`;
    pointsOnLevel = points.filter(point => point.level === level);
    currentSet_0 = clusterize(pointsOnLevel, clusterInitObj[0]);
    currentSet_1 = clusterize(pointsOnLevel, clusterInitObj[1]);
    currentSet_2 = clusterize(pointsOnLevel, clusterInitObj[2]);
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

    //centerizeFn();

    // if (mainLayer) {
    //     mainLayer
    //         .attr("transform", `translate(${currentRatioImgData.zoom.x},${currentRatioImgData.zoom.y}) scale(${currentRatioImgData.k*currentRatioImgData.zoom.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`);
    // }
    if (mainLayer) {
        mainLayer
            .attr("transform", `translate(${currentRatioImgData.zoom.x},${currentRatioImgData.zoom.y}) scale(${currentRatioImgData.k*currentRatioImgData.zoom.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`);
    }
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
    //.attr("transform", `scale(${currentRatioImgData.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`)    

    floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
    let floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("xlink:href", floorSrc);
    floor.on("load", () => {
        drawSet('all', currentSet_0, 'big');
    });

    mainLayer
        .transition()
        .duration(700)
        .attr("opacity", "1");

    zoom = d3.zoom()
        .scaleExtent([0.3, 10])
        .on("zoom", () => {
            deleteSet('svg', '.highLight');
            zoomed();
            rebuildClusters();
        });
    // .on("start", () => {
    // })
    // .on("end", () => {
    // });
    svg.call(zoom);
    d3.select("svg").on("dblclick.zoom", null);
}

function rebuildClusters() {
    let scale = d3.zoomTransform(svg.node()).k;
    //console.log(scale.toFixed(1), oldScale.toFixed(1));
    if (scale.toFixed(1) === oldScale.toFixed(1)) return;
    oldScale = scale;
    deleteSet('svg', '.set');
    let dataForClusters;
    let pinSize = "big";

    if (scale <= 2.5) {
        dataForClusters = currentSet_0;
    } else if (scale > 2.5 && scale <= 4) {
        dataForClusters = currentSet_1;
    } else {
        dataForClusters = currentSet_2;
        pinSize = "small";
    }
    drawSet('all', dataForClusters, pinSize);
}


function drawSet(itemToShow, currentSet, sizePoint = "big", isChecked = true) {
    if (isChecked) {
        set = mainLayer.append("g");
        set.attr("class", `set ${itemToShow}`)
            .selectAll("g")
            .data(currentSet)
            .join("g")
            .attr("pointer-events", "visible")
            .attr("cursor", "pointer")
            .attr("id", d => d.name)
            .append("circle")
            .attr("fill", d => d.pointsCopy.length > 1 ? "#00BD63" : "#FF2A2A")
            .attr("cx", d => d.centroid.x)
            .attr("cy", d => d.centroid.y + 165)
            .attr("r", d => d.pointsCopy.length > 1 ? 40 : sizePoint === "big" ? 35 : 10)
            .on("click", clickedOnPin)
            .on('mouseenter', d => highLight(d, true))
            .on('mouseleave', d => highLight(d, false))

        set
            .selectAll("g")
            .data(currentSet)
            .join("g")
            .append("text")
            .attr("x", d => d.centroid.x)
            .attr("y", d => d.centroid.y + 168)
            .attr("text-anchor", "middle")
            .attr("font-size", d => d.pointsCopy.length > 1 ? 45 : sizePoint === "big" ? 30 : 8)
            .attr("fill", "white")
            .attr("font-family", "sans-serif")
            .attr("dy", d => d.pointsCopy.length > 1 ? "12" : sizePoint === "big" ? "5" : "-1")
            .attr("dx", "0")
            .attr("pointer-events", "none")
            .text(d => d.pointsCopy.length > 1 ? d.pointsCopy.length : d.pointsCopy[0].name);
    } else {
        let current = svg.select(`.${itemToShow}`);
        if (current) current.remove();
    }
}


function highLight(d, isBuild) {
    if(d.pointsCopy.length ===1) return;
    if(!isBuild) {
        deleteSet('svg', '.highLight');
    }
    if(isBuild) {
        svg
            .select('.mainLayer')
            .append('g')
            .attr('class', 'highLight')
            .selectAll('circle')
            .data(d.pointsCopy)
            .join("circle")
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img + 165)
            .attr('pointer-events', 'none')
            .attr('r', 25)
            .attr('fill', "#FF2A2A"); 
    }
}


function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector);
    } else if (base === "svg") {
        element = svg.select(selector);
    }
    if (element) element.remove();
}

function clickedOnPin(d) {
    let points = d.pointsCopy;
    if (points.length === 1) {
        let {
            name,
            phase
        } = points[0];
        window.open("../PANOS/mainPointCloud.html?level=" + level + "&name=" + name + "&phase=" + phase, "_self");
    } else {
        
        let {clientX, clientY} = d3.event;
        console.log('---too much', clientX, clientY);
    }
};

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function drawCover(itemToShow, isChecked) {
    console.log("cover to build:", itemToShow, isChecked);
    if (isChecked) {
        cover = floorLayer.insert("image", ":first-child");
        cover.attr("xlink:href", coverSrc.src);
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
        .translate([currentRatioImgData.x, currentRatioImgData.y]);
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