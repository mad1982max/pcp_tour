let header, footer, container;
let level, floorSrc, coverSrc, set, svg, svgHeight, floorLayer, mainLayer, floor;
let zoom;
let asideContent;
let setFlagObj = {};
let transform = {
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
let pointsOnLevel;
let subLevelToShow = 'sub_0';
let pinSize;

let isFirstFloorLoading = true;
let highlghtedVisible = false;
let currentCluster;
let subLevelData;
let subLevel;

let subLevels = [{
        level: 'level_47.8',
        edge: 50
    },
]

window.onload = onloadFn;

function defineData4Floor() {
    let paramsString = window.location.search;
    let searchParams = new URLSearchParams(paramsString);
    level = searchParams.get("level");
    subLevel = getSubLevel(level);
    if(subLevel) {
        floorSrc = `./img/new/${level}_${subLevelToShow}.png`;
    } else {
        floorSrc = `./img/new/${level}.png`;
    }    
    pointsOnLevel = points.filter(point => point.level === level);
}

function onloadFn() {
    defineData4Floor();
    header = document.querySelector(".header");
    footer = document.querySelector(".footer");
    container = document.getElementById("container");
    let showHideBtn = document.querySelector(".hideAside");
    showHideBtn.addEventListener('click', displayAsideFn);
    let asideSvg = document.getElementById('asideSvg');    
    
    if(subLevel) {
        console.log('subLevel.edge', subLevel.edge)
        let subLevelImg = `./img/new/sub_${level}.svg`;
        asideSvg.setAttribute('data', subLevelImg);

        asideSvg.onload = function() {
            asideContent = asideSvg.contentDocument;
            reColorizeSubFloor(subLevelToShow);
            let floorRect = [...asideContent.querySelectorAll('.block')];
            floorRect.forEach(singleBlock => {
                singleBlock.addEventListener('click', clickSubFloor);
                singleBlock.addEventListener('mouseenter', mouseOverSubFloor);
                singleBlock.addEventListener('mouseleave', mouseLeaveSubFloor);
            })
        }        
    } else {
        let aside = document.querySelector('.aside');
        aside.style.display = 'none';
    }    

    window.addEventListener("resize", resize);
    resize();
    buildSvg();
}

function mouseLeaveSubFloor() {
    this.style.fill = 'none';
}

function displayAsideFn() {
    let aside = document.querySelector('.aside');
    aside.classList.toggle('hide');

    let shevron = document.querySelector('.shevron');
    let angle = 180;
    let hideSidePosition = 3;
    if(aside.classList.contains('hide')) {
        angle = 0;
        hideSidePosition = -48;
    }    
    shevron.setAttribute("style", "transform: rotate(" + angle + "deg)");
    if(this !== window) {
        this.style.left = hideSidePosition + 'px';
    }
}

function mouseOverSubFloor() {
    this.style.fill = 'rgba(0,0,0,0.2)';
    this.style.cursor = 'pointer';
}

function clickSubFloor(e) {
    document.body.style.opacity = 0;
    deleteSet('svg', '.set');
    deleteSet('svg', '.showTiedPins');
    
    subLevelToShow = e.target.id;
    reColorizeSubFloor(subLevelToShow);

    floorSrc = `./img/new/${level}_${subLevelToShow}.png`;
    floor.attr("xlink:href", floorSrc);

    let pointsArr;
    if (subLevel) {
        pointsArr = pointsOnLevel.filter(item => subLevelToShow === "sub_0" ? item.z_real < subLevel.edge : item.z_real > subLevel.edge)
    } else {
        pointsArr = pointsOnLevel
    }

    let sensitive = defineSensitiveOnCurrentZoom(oldScale, clusterInitObj)
    let dataForClusters = clusterize(pointsArr, sensitive);
    pinSize = oldScale <=2 ? "big":"small";
    drawSet(dataForClusters, pinSize);    
}

function defineSensitiveOnCurrentZoom(scale, clusterInitObj) {
    let sensitive;
    if (scale <= 1.5) {
        sensitive = clusterInitObj[0]
    } else if (oldScale > 1.5 && oldScale <= 2) {
        sensitive = clusterInitObj[1]
    } else {
        sensitive = clusterInitObj[2]
    }
    return sensitive;
}

function resize() {
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    let wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let svgHeight = wHeight - headerFooterHeight;

    if (wWidth > svgHeight * transform.initPicWidth / transform.initPicH) {
        transform.k = svgHeight / transform.initPicH;
        transform.x = (wWidth / transform.k - transform.initPicWidth) / 2;
        transform.y = 0;
    } else {
        transform.k = wWidth / transform.initPicWidth;
        transform.x = 0;
        transform.y = (svgHeight / transform.k - transform.initPicH) / 2;
    }
    container.style.height = `${svgHeight}px`;
    container.style.width = `${wWidth}px`;

    //centerizeFn();

    if (mainLayer) {
        mainLayer
            .attr("transform", `translate(${transform.zoom.x},${transform.zoom.y}) scale(${transform.k*transform.zoom.k}) translate(${transform.x},${transform.y})`);
    }
}

function getSubLevel(level) {
    return subLevels.find(lvl => lvl.level === level);
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
        .attr("transform", `scale(${transform.k}) translate(${transform.x},${transform.y})`)

    floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
        .on('click', () => {
            if (svg.select('showTiedPins')) deleteSet('svg', '.showTiedPins');
            currentCluster = null;
        })
    floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("xlink:href", floorSrc);
    floor.on("load", () => {
        document.body.style.opacity = 1;
        if(isFirstFloorLoading) {
            let pointsArr = subLevel ? getSubPoints(subLevelToShow, pointsOnLevel, subLevel.edge) : pointsOnLevel;
            let currentSet = clusterize(pointsArr, clusterInitObj[0]);
            displayAsideFn();
            drawSet(currentSet, 'big');
            isFirstFloorLoading = false
        }
    });
    mainLayer
        .transition()
        .duration(700)
        .attr("opacity", "1");

    zoom = d3.zoom()
        .scaleExtent([0.3, 10])
        .on("zoom", () => {
            deleteSet('svg', '.showTiedPins');
            zoomed();
            rebuildClusters();
        });
    svg.call(zoom);
    d3.select("svg").on("dblclick.zoom", null);
}

function getSubPoints(subFloor, allPoints, edge) {
    let points = [];
    switch(subFloor) {
        case 'sub_0':
            points = allPoints.filter(item => item.z_real < edge);
            break;
        case 'sub_1':
            points = allPoints.filter(item => item.z_real > edge);
            break;
        default:
            console.log('sub_XXX error');
    }
    return points;
}

function rebuildClusters() {
    let scale = d3.zoomTransform(svg.node()).k;
    if (scale.toFixed(1) === oldScale.toFixed(1)) return;
    oldScale = scale;
    deleteSet('svg', '.set');

    let pointsArr = subLevel ? getSubPoints(subLevelToShow, pointsOnLevel, subLevel.edge) : pointsOnLevel;
    let sensitive = defineSensitiveOnCurrentZoom(scale, clusterInitObj)
    let dataForClusters = clusterize(pointsArr, sensitive);
    pinSize = oldScale <=2 ? "big":"small";

    drawSet(dataForClusters, pinSize);
}


function drawSet(currentSet, sizePoint = "big") {
    set = mainLayer.append("g");
    set.attr("class", "set")
        .selectAll("g")
        .data(currentSet)
        .join("g")
        .attr("pointer-events", "visible")
        .attr("cursor", "pointer")
        .attr("id", d => d.name)
        .append("circle")
        .attr("fill", d => d.pointsCopy.length > 1 ? "#00BD63" : "#FF2A2A")
        .attr("cx", d => d.centroid.x)
        .attr("cy", d => d.centroid.y)
        .attr("r", d => d.pointsCopy.length > 1 ? 40 : sizePoint === "big" ? 25 : 10)
        .on("click", clickedOnPin)
    set
        .selectAll("g")
        .data(currentSet)
        .join("g")
        .append("text")
        .attr("x", d => d.centroid.x)
        .attr("y", d => d.centroid.y + 3)
        .attr("text-anchor", "middle")
        .attr("font-size", d => d.pointsCopy.length > 1 ? 45 : sizePoint === "big" ? 16 : 8)
        .attr("fill", "white")
        .attr("font-family", "sans-serif")
        .attr("dy", d => d.pointsCopy.length > 1 ? "12" : sizePoint === "big" ? "3" : "-1")
        .attr("dx", d => d.pointsCopy.length > 1 ? "0" : sizePoint === "big" ? "0" : "0")
        .attr("pointer-events", "none")
        .text(d => d.pointsCopy.length > 1 ? d.pointsCopy.length : d.pointsCopy[0].name);
}

function reColorizeSubFloor(subLevelToShow) {
    let blocks = [...asideContent.querySelectorAll('.block')];
    blocks.forEach(block => {
        block.style.stroke = 'none';
    });
    
    let clickedBlock = asideContent.querySelector(`.${subLevelToShow}`);
    clickedBlock.style.stroke = '#FFF773';
    clickedBlock.style.strokeWidth = 5;
}

function showTiedPins(d, isBuild) {
    if (d.pointsCopy.length === 1) return;
    if (!isBuild) {
        deleteSet('svg', '.showTiedPins');
    }
    if (isBuild) {
        svg
            .select('.mainLayer')
            .append('g')
            .attr('class', 'showTiedPins')
            .selectAll('circle')
            .data(d.pointsCopy)
            .join("circle")
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img)
            .attr('pointer-events', 'visible')
            .attr('r', 25)
            .attr('fill', "#FF2A2A")
            .attr("cursor", "pointer")
            .on("click", clickedOnshowTiedPinsed)

        svg
            .select('.mainLayer')
            .append('g')
            .attr('class', 'showTiedPins')
            .selectAll('g')
            .data(d.pointsCopy)
            .join("g")
            .append("text")
            .attr("x", d => d.x_img)
            .attr("y", d => d.y_img + 3)
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .attr("fill", "white")
            .attr("font-family", "sans-serif")
            .attr("dy", 3)
            .attr("dx", 0)
            .attr("pointer-events", "none")
            .text(d => d.name);
    }
}

function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector);
    } else if (base === "svg") {
        element = svg.selectAll(selector);
    }
    if (element) element.remove();
}

function clickedOnshowTiedPinsed(d) {
    let {
        name,
        phase
    } = d;
    window.open("../PANOS/mainPointCloud.html?level=" + level + "&name=" + name + "&phase=" + phase, "_self");
}

function clickedOnPin(d) {
    deleteSet('svg', '.showTiedPins');
    let points = d.pointsCopy;
    if (points.length === 1) {
        let {
            name,
            phase
        } = points[0];
        window.open("../PANOS/mainPointCloud.html?level=" + level + "&name=" + name + "&phase=" + phase, "_self");
    } else {
        if (currentCluster === d.id) {
            deleteSet('svg', '.showTiedPins');
            currentCluster = null;
        } else {
            showTiedPins(d, true);
            currentCluster = d.id;
        }
    }
};

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function zoomed() {
    let {
        k,
        x,
        y
    } = d3.event.transform;

    let transform2 = d3Transform()
        .translate([x, y])
        .scale(k * transform.k)
        .translate([transform.x, transform.y]);
    mainLayer.attr("transform", transform2);

    transform.zoom = {
        x,
        y,
        k
    };
}