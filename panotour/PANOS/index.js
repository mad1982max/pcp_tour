'use strict';
let container, tooltipElem, wrapper, currentSceneIndex;
let level, sceneList, floorSrc, wHeight, wWidth, set, svg, svgHeight, floorLayer, mainLayer, miniMap, clickedPin;
let showMiniMapFlag = false;
let defaultColor;
let checkedColor = '#00cc66'
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


//add resizeBtnFn----------------------------------
function makeResizableDiv( div ) {
    const element = document.querySelector( div );
    const resizer = document.querySelector( '.resizeMapBtn' )
    const minimum_size = 200;
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;

    function touchStart(e) {
        console.log( 'mousedown resiser' );
  
      e.preventDefault()
      e.stopPropagation()
  
      original_height = element.getBoundingClientRect().height;
      original_width = element.getBoundingClientRect().width;
      original_x = element.getBoundingClientRect().left;
      original_y = element.getBoundingClientRect().top;

      original_mouse_x = e.pageX || e.touches[0].pageX;
      original_mouse_y = e.pageY || e.touches[0].pageY;

      window.addEventListener( 'mousemove', resizeByDrag );
      window.addEventListener( 'touchmove', resizeByDrag );
      window.addEventListener( 'mouseup', stopResize );
      window.addEventListener( 'touchend', stopResize );
    }  

    resizer.addEventListener( 'mousedown', touchStart );
    resizer.addEventListener( 'touchstart', touchStart )
  
    function resizeByDrag( e ) {
      const width = original_width - ( (e.pageX || e.touches[0].pageX) - original_mouse_x );
      const height = width/curPos.initPicW*curPos.initPicH;
      if ( width > minimum_size ) {
        element.style.width = width + 'px'
        element.style.height = height + 'px'
      } else {
        element.style.width = minimum_size + 'px'
       
      }
      resize();
    }
  
    function stopResize() {
      window.removeEventListener( 'mousemove', resizeByDrag );
      window.removeEventListener( 'touchmove', resizeByDrag );
    }
    
  }
 //end  resizeBtnFn---------------------------------- 

window.onload = onloadFn;

function onloadFn() {
    document.body.style.opacity = 1;
    makeResizableDiv( '#sceneList' );
    sceneList = document.querySelector('#sceneList');
    wrapper = document.getElementById('wrapper');
    window.addEventListener('resize', resize);
    buildSvg();
    resize();    
}

function ref() {
    let newRef = '/panotour/levels/sitemap.html' + window.location.search;
    document.location.href = newRef;
}

function resize() {
    deleteTooltip();
    
    let sceneListW = sceneList.offsetWidth;
    if(sceneListW === window.innerWidth) {
        sceneList.style.height = `${mainLayer.node().getBoundingClientRect().height}px`;
        sceneList.style.width = `${mainLayer.node().getBoundingClientRect().width}px`;
    }

    if (sceneListW > wrapper.offsetHeight * curPos.initPicW / curPos.initPicH) {
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
        .attr('opacity', '1');
    const zoom = d3
        .zoom()
        .scaleExtent([0.3, 7])
        .on('zoom', zoomed);
    svg.call(zoom);  
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
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img + 165)
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
    switchPhoto360Observable.notify(clickedPin);
    createToolTip(d.name, d.phase, d3.event.pageX, d3.event.pageY);
};

function createToolTip(id, phase, x, y, flag = false) {
    deleteTooltip();
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
        deleteTooltip()
        return
    }
    if (window.innerWidth - d3.event.pageX < 50) tooltipPosFlag = true;
    createToolTip(id, phase, d3.event.pageX, d3.event.pageY, tooltipPosFlag);
}

function deleteTooltip() {
    if (tooltipElem) {
        tooltipElem.remove();
        tooltipElem = null;
    }
}