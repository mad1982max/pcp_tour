'use strict';
let container, tooltipElem, wrapper, currentSceneIndex;
let level, floorSrc, wHeight, wWidth, set, svg, svgHeight, floorLayer, mainLayer, miniMap, clickedPin;
let showMiniMapFlag = false;
let defaultColor;
let checkedColor = '#0066ff'
let tooltipPosFlag = false;
let phase;
let curPos = {
    zoom: {
        x: 0,
        y: 0,
        k: 1
    },
    x: 0,
    y: 0,
    initPicW: 3000,
    initPicH: 1850,
    k: 0
}

let pointsOnLevel;
let currentScene;

//define query-----------------------------
defineData4Floor();

function defineData4Floor() {
    var paramsString = window.location.search;
    var searchParams = new URLSearchParams(paramsString);
    level = searchParams.get('level');
    name = searchParams.get('name');
    phase = searchParams.get('phase');
    clickedPin = `${phase}_${name}`;
    floorSrc = `../levels/IMG/${level}.png`
    pointsOnLevel = points.filter(point => point.level === level);
    defaultColor = phase === 'PHASE1' ? 'red' : 'green';
    currentScene = tails.find(scene => scene.name === clickedPin)
}
//---end define query------------------

window.onload = onloadFn;

function onloadFn() {
    //miniMap = document.getElementById('#showButton');
    wrapper = document.getElementById('wrapper');
    let sceneList = document.getElementById('sceneList');
    window.addEventListener('resize', resize);

    // wrapper.addEventListener('mousedown', mouseDownFn);
    // wrapper.addEventListener('dragstart', dragStartFn);

    //pano.readConfigUrlAsync('./' + level + '/node' + name + '.xml');
    buildSvg();
    resize();
    document.body.style.opacity = 1;
}

function ref() {
    let newRef = '/panotour/levels/sitemap.html' + window.location.search;
    document.location.href = newRef;
}

function resize() {
    console.log('-----resize');


    getScreenWidthHeight();

    if (wWidth > wrapper.offsetHeight * curPos.initPicW / curPos.initPicH) {
        curPos.k = wrapper.offsetHeight / curPos.initPicH;
        curPos.x = (wrapper.offsetWidth / curPos.k - curPos.initPicW) / 2;
        curPos.y = 0;
    } else {
        curPos.k = wrapper.offsetWidth / curPos.initPicW;
        curPos.x = 0;
        curPos.y = (wrapper.offsetHeight / curPos.k - curPos.initPicH) / 5;
    }

    if (mainLayer) {
        mainLayer
            .attr('transform', `translate(${curPos.zoom.x},${curPos.zoom.y}) scale(${curPos.k*curPos.zoom.k}) translate(${curPos.x},${curPos.y})`)
    }

    
}

function getScreenWidthHeight() {
    wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    svgHeight = wHeight;
}

function buildSvg() {

    svg = d3.select('#wrapper').append('svg');
    svg
        .attr('class', 'svgContainer')
        .attr('height', '100%')
        .attr('width', '100%')

    mainLayer = svg.append('g');
    mainLayer
        .attr('class', 'mainLayer')
        .attr('opacity', '0')
        .attr('transform', `scale(${curPos.k}) translate(${curPos.x},${curPos.y})`)

    floorLayer = mainLayer.append('g')
    floorLayer
        .attr('class', 'floorLayer')
    let floor = floorLayer.append('image');
    floor.attr('class', 'currentFloor');
    floor.on('load', () => {
        drawSet(phase)
    })
    floor.attr('xlink:href', floorSrc)
    mainLayer
        .transition()
        .duration(700)
        .attr('opacity', '1')

    const zoom = d3
        .zoom()
        .scaleExtent([0.3, 7])
        .on('zoom', zoomed);
    svg.call(zoom);  
}

function showMap() {
    showMiniMapFlag = !showMiniMapFlag;
    wrapper.style.visibility = showMiniMapFlag ? 'visible' : 'hidden';
    if (!showMiniMapFlag && tooltipElem) tooltipElem.remove();
}

function zoomed() {
    const {
        transform
    } = d3.event;
    let {
        k,
        x,
        y
    } = transform;
    let transform2 = d3Transform()
        .translate([x, y])
        .scale(k * curPos.k)
        .translate([curPos.x, curPos.y])
    mainLayer.attr('transform', transform2);

    curPos.zoom = {
        x,
        y,
        k
    };
    curPos.tr = transform2;
}

function drawSet(itemToShow, isChecked = true) {
    let currentSet = pointsOnLevel.filter(point => point.phase === itemToShow);
    if (isChecked) {
        set = mainLayer.append('g')
        set.attr('class', `set ${phase}`)
            .selectAll('g')
            .data(currentSet)
            .join('g')
            .attr('pointer-events', 'visible')
            .attr('cursor', 'pointer')
            .attr('id', d => `_${d.name}`)
            .append('circle')
            .attr('fill', (d) => d.fullname === clickedPin ? checkedColor : defaultColor)
            .attr('cx', d => {
                return d.x_img
            })
            .attr('cy', d => {
                return (d.y_img + 165)
            })
            .attr('r', 30)
            .on('click', clickedOnPin)
            .on('mousemove', (d) => toolTip(d.name, d.phase, true))
            .on('mouseleave', (d) => toolTip(d.name, d.phase, false));

    } else {
        if (set) svg.select('.set').remove();
    }
}

function reColorize(selector, oldColor, singleElem, newColor) {
    set.selectAll(selector).attr('fill', oldColor);
    if (singleElem.attr) {
        singleElem.attr('fill', newColor)
    } else {
        singleElem.setAttribute('fill', newColor);
    }
}

function clickedOnPin(d) {
    reColorize('circle', defaultColor, d3.event.target, checkedColor);
    clickedPin = d.fullname;
    switchPhoto360Observable.notify(clickedPin)
    createToolTip(d.name, d.phase, d3.event.pageX, d3.event.pageY);
};

function createToolTip(id, phase, x, y, flag = false) {
    if (tooltipElem) {
        tooltipElem.remove();
        tooltipElem = null;
    }
    let posYDelta = 15;
    let posXDelta = flag ? -35 : 15;
    tooltipElem = document.createElement('div');
    tooltipElem.className = 'tooltip';
    tooltipElem.innerHTML = id;
    tooltipElem.style.left = (x + posXDelta) + 'px';
    tooltipElem.style.top = (y + posYDelta) + 'px';
    let fillColor = `${phase}_${id}` == clickedPin ? checkedColor : defaultColor;
    tooltipElem.style.backgroundColor = fillColor;
    document.body.append(tooltipElem);
}

function toolTip(id, phase, actionFlag) {
    if (!actionFlag) {
        tooltipElem.remove();
        return
    }
    if (window.innerWidth - d3.event.pageX < 50) tooltipPosFlag = true;
    createToolTip(id, phase, d3.event.pageX, d3.event.pageY, tooltipPosFlag);
}