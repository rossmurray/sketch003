var fnMain = (function() {
    function render(deltaMs, state) {
        requestAnimationFrame(function(timestamp){
            render(timestamp, state);
        });
        let graphics = state.graphics;
        graphics.clear();
        //draw
        state.app.renderer.render(state.graphics);
        state.recorder.capture(state.app.renderer.view);
    }

    function getConfig() {
        let palette = ['#6f32b0', '#000000', '#191754', '#b9f0d5'];
        return {
            numThings: 2000,
            margin: 0.04, //percent on each edge not included in 'board' rectangle
            colorScale: chroma.scale(palette).mode('lab'), //modes: lch, lab, hsl, rgb
            backgroundColor: 0x0,
        };
    }

    function animateThings(things, board, config) {
        const animation = anime({
            targets: things,
            someProperty: 100,
            complete: function() {
                animateThings(things, board, config).play();
            },
            autoplay: false,
        });
        return animation;
    }

    function makeBoardRectangle(margin, viewRectangle) {
        const realMargin = viewRectangle.width * margin;
        const realMargin2 = realMargin * 2;
        const boardWidth = viewRectangle.width - realMargin2;
        const boardHeight = viewRectangle.height - realMargin2;
        return new PIXI.Rectangle(realMargin, realMargin, boardWidth, boardHeight);
    }

    function makeRange(n) {
        var arr = Array.apply(null, Array(n));
        return arr.map(function (x, i) { return i });
    };

    function randomColor(colorScale) {
        const colorArray = colorScale(Math.random()).rgb();
        const colorNumber = RGBTo24bit(colorArray);
        return colorNumber;
    }

    function RGBTo24bit(rgbArray) {
        let result = Math.floor(rgbArray[2])
            | Math.floor(rgbArray[1]) << 8
            | Math.floor(rgbArray[0]) << 16;
        return result;
    }

    return (function() {
        const config = getConfig();
        const mainel = document.getElementById("main");
        let app = new PIXI.Application({
            width: mainel.width,
            height: mainel.height,
            view: mainel,
            autoResize: true,
            antialias: true,
        });
        app.renderer.backgroundColor = config.backgroundColor;
        app.ticker.autoStart = false;

        let graphics = new PIXI.Graphics();
        let board = makeBoardRectangle(config.margin, app.screen);
        //init some objects or paused animations
        let state = {
            config: config,
            app: app,
            graphics: graphics,
            board: board,
            //add objects to bag
        };
        return function(recorder) {
            state.recorder = recorder || {capture: function(){}};
            render(Date.now(), state);
            //start animation
            return state;
        }
    })();
})();