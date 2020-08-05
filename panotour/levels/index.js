let header, footer, container;
let level, floorSrc, coverSrc, headerFooterHeight, wHeight, wWidth, cover, set, svg, svgHeight, floorLayer, mainLayer, green, red;
let setFlagObj = {};
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
let setsToShow = [];
let pointsOnLevel;

window.onload = onloadFn;

function defineData4Floor() {
    let paramsString = window.location.search;
    let searchParams = new URLSearchParams(paramsString);
    level = searchParams.get('level');
    floorSrc = `./img/${level}.png`
    coverSrc = new Image();
    coverSrc.src = `./img/${level}_coverGrey.gif`;
    green = new Image();
    green.src = `./img/green_.svg`;
    red = new Image();
    red.src = `./img/red_.svg`;
    pointsOnLevel = points.filter(point => point.level === level)
}

function onloadFn() {
    defineData4Floor();
    header = document.querySelector('.header');
    footer = document.querySelector('.footer');
    container = document.getElementById('container');
    window.addEventListener('resize', resize);
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

    if (wWidth > svgHeight * curPos.initPicW / curPos.initPicH) {
        curPos.k = svgHeight / curPos.initPicH;
        curPos.x = (wWidth / curPos.k - curPos.initPicW) / 2;
        curPos.y = 0;
    } else {
        curPos.k = wWidth / curPos.initPicW;
        curPos.x = 0;
        curPos.y = (wHeight / curPos.k - curPos.initPicH) / 5;
    }
    container.style.height = `${svgHeight}px`;
    container.style.width = `${wWidth}px`;

    if (mainLayer) {
        mainLayer
            .attr('transform', `translate(${curPos.zoom.x},${curPos.zoom.y}) scale(${curPos.k*curPos.zoom.k}) translate(${curPos.x},${curPos.y})`)
    }
}

function buildSvg() {

    svg = d3.select('#container').append('svg');
    svg
        .attr('class', 'svgContainer')
        .attr('height', '100%')
        .attr('width', '100%')

    mainLayer = svg.append('g');
    mainLayer
        .attr('class', 'mainLayer')
        .attr("opacity", "0")
        .attr('transform', `scale(${curPos.k}) translate(${curPos.x},${curPos.y})`)


    

    floorLayer = mainLayer.append('g')
    floorLayer
        .attr('class', 'floorLayer')
    let floor = floorLayer.append('image');
    floor.attr('class', 'currentFloor');
    floor.on('load', () => {
        let checkBoxArr = [...document.querySelectorAll('.form-check-input')];
        console.log('checkBoxArr', checkBoxArr);
        checkBoxArr.forEach(box => {
            setFlagObj[box.id] = box.checked;
            box.addEventListener('change', (e) => checkBoxListener(e.target.id, e.target.checked))
            checkBoxListener(box.id, box.checked);

        });
    })
    floor.attr('xlink:href', floorSrc)
    mainLayer
        .transition()
        .duration(700)
        .attr("opacity", "1")
        

    const zoom = d3
        .zoom()
        .scaleExtent([0.3, 7])
        .on('zoom', zoomed)
        .on('start', () => {
            console.log('---');
            // mainLayer
            //     .selectAll('.set')
            //     .transition()
            //     .duration(300)
            //     .attr("visibility","hidden")
        })
        .on('end', () => {
            mainLayer
                .selectAll('.set')
                .transition()
                .duration(500)
                .attr("visibility","visibile")
        })
    svg.call(zoom);
}

function checkBoxListener(itemToShow, isChecked) {
    switch (itemToShow) {
        case 'cover':
            drawCover(itemToShow, isChecked);
            break;
        case 'PHASE1':
        case 'PHASE2':
            drawSet(itemToShow, isChecked);
            break;
        default:
            console.log('--nothing to draw');
    }
}

function drawSet(itemToShow, isChecked) {
    console.log('to add', itemToShow, isChecked);

    if (isChecked) {
        let currentSet = pointsOnLevel.filter(point => point.phase === itemToShow)

        let pinSrc = itemToShow === 'PHASE1' ? red.src : green.src

        // set = mainLayer.append('g')
        // set.attr('class', 'set')
        //     .selectAll('g')        
        //     .data(set1)
        //     .join('g')
        //     .attr('pointer-events', 'visible')
        //     .attr('cursor', 'pointer')
        //     .attr('id', d => d.id)
        //     .append('circle')
        //         .attr('fill', '#ff0066')
        //         .attr('cx', d => {
        //             return d.x
        //         })
        //         .attr('cy', d => {
        //             return (d.y + 165)
        //         })
        //         .attr('r', 30)
        //         .on('click', clickedOnPin)  

        set = mainLayer.append('g')
        set.attr('class', `set ${itemToShow}`)
            .selectAll('g')
            .data(currentSet)
            .join('g')
            .attr('pointer-events', 'visible')
            .attr('cursor', 'pointer')
            .attr('id', d => d.name)
            .append('image')
            .attr('class', 'currentFloor')
            .attr('xlink:href', pinSrc)
            .attr('x', d => {
                return d.x_img - 25
            })
            .attr('y', d => {
                return (d.y_img + 115)
            })
            .on('click', clickedOnPin);
        set
            .selectAll('g')
            .data(currentSet)
            .join('g')
            .append('text')
            .attr('x', d => {
                return d.x_img
            })
            .attr('y', d => {
                return (d.y_img + 168)
            })
            .attr('text-anchor', 'middle')
            .attr('font-size', 20)
            .attr('fill', 'white')
            .attr('font-family', 'sans-serif')
            .attr('dy', '-26')
            .attr('dx', '-1')
            .attr('pointer-events', 'none')
            .text(d => d.name);
    } else {
        let current = svg.select(`.${itemToShow}`)
        if (current) current.remove();
    }
}

function clickedOnPin(d) {
    console.log('clicked pin:', d);
    window.open("../PANOS/mainPointCloud.html?level=" + level + "&name=" + d.name + "&phase=" + d.phase, "_self");
};


function drawCover(itemToShow, isChecked) {
    console.log('cover to build:', itemToShow, isChecked);
    if (isChecked) {
        cover = floorLayer.insert('image', ":first-child");
        cover.attr('xlink:href', coverSrc.src)
    } else {
        if (cover) cover.remove();
    }
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