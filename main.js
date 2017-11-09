var fnMain = (function() {
    function render(deltaMs, state) {
        requestAnimationFrame(function(timestamp){
            render(timestamp, state);
        });
        // let graphics = state.graphics;
        // graphics.clear();
        //state.app.renderer.render(state.graphics);
        state.app.renderer.render(state.app.stage);
        state.recorder.capture(state.app.renderer.view);
    }

    function getConfig() {
        let palette = ['cyan', 'magenta', 'yellow'];
        return {
            numShapes: 20,
            shapeRadius: 0.4,
            nSides: 3,
            lineWidth: 0.05,
            spinDuration: 2000,
            spinDelay: 600,
            margin: 0.04, //percent on each edge not included in 'board' rectangle
            colorScale: chroma.scale(palette).mode('lab'), //modes: lch, lab, hsl, rgb
            palette: palette,
            backgroundColor: 0x0,
        };
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

    function makeShapes(config, board, renderer) {
        function makeShape(i) {
            const g = new PIXI.Graphics();
            //const width = config.shapeRadius * 2.1;
            // g.width = width;
            // g.height = width;
            g.width = board.width;
            g.height = board.height;
            // const half = Math.floor(g.width / 2);
            // const center = { x: half, y: half };
            const halfx = board.width / 2;
            const halfy = board.height / 2;
            g.lineStyle(0);
            //g.blendMode = PIXI.BLEND_MODES.ADD;
            const color = RGBTo24bit(chroma.random().rgb());
            //const color = RGBTo24bit(chroma(config.palette[i]).rgb());
                //|| RGBTo24bit(config.colorScale(i / config.numShapes).rgb());
            g.beginFill(color, 1)
            //g.drawCircle(halfx, halfy, config.shapeRadius);
            g.drawRect(halfx/2, halfy/2, board.width/2, board.height/2);
            // g.lineStyle(config.lineWidth, color);
            // g.moveTo(
            //     config.shapeRadius * Math.cos(Math.PI * 2 * i / config.nSides) + halfx,
            //     config.shapeRadius * Math.sin(Math.PI * 2 * i / config.nSides) + halfy
            // );
            // for(let i = 1; i < config.nSides; i++) {
            //     g.lineTo(
            //         config.shapeRadius * Math.cos(Math.PI * 2 * i / config.nSides) + halfx,
            //         config.shapeRadius * Math.sin(Math.PI * 2 * i / config.nSides) + halfy
            //     );
            // }
            //set anchor
            // g.x = board.width / 2;
            // x.y = board.height / 2;
            const texture = PIXI.RenderTexture.create(board.width, board.height);
            renderer.render(g, texture);
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5, 0.5);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            sprite.x = halfx;
            sprite.y = halfy;
            const shape = {
                sprite: sprite,
            };
            return shape;
        }
        let shapes = makeRange(config.numShapes).map((x, i) => {
            return makeShape(i);
        });
        return shapes;
    }

    function animateShapes(shapes, board, config) {
        const timeline = anime.timeline({
            autoplay: false,
            loop: true
        });
        shapes[0].dummy = 0;
        for(let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            timeline.add({
                targets: shape.sprite,
                rotation: Math.PI * 2,
                easing: 'easeOutSine',
                offset: i * (config.spinDuration * 0.02),
                elasticity: 0,
                duration: config.spinDuration,
            });
        }
        // timeline.add({
        //     targets: shapes[0],
        //     dummy: 0,
        //     delay: config.spinDuration,
        //     duration: config.spinDelay,
        // });
        return timeline;
        // const animation = anime({
        //     targets: shapes,
        //     rotation: {
        //         value: Math.PI * 2,
        //         duration: config.spinDuration,
        //         delay: (el, i) => i * 200,
        //         easing: 'linear',
        //     },
        //     complete: function() {
        //         //animateShapes(shapes, board, config).play();
        //     },
        //     loop: true,
        //     autoplay: false,
        // });
        // return animation;
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
            autoStart: false,
        });
        app.renderer.backgroundColor = config.backgroundColor;
        //note: this prevents ticker starting when a listener is added. not when the application starts.
        app.ticker.autoStart = false;
        //app.ticker.stop();

        let board = makeBoardRectangle(config.margin, app.screen);
        config.lineWidth = config.lineWidth * board.width; //should use diagonal
        config.shapeRadius = config.shapeRadius * board.width;
        const shapes = makeShapes(config, board, app.renderer);
        for(let s of shapes) {
            app.stage.addChild(s.sprite);
        }
        const animation = animateShapes(shapes, board, config);
        let state = {
            config: config,
            app: app,
            board: board,
            animation: animation,
            shapes: shapes,
        };
        return function(recorder) {
            state.recorder = recorder || {capture: function(){}};
            app.start();
            render(Date.now(), state);
            animation.play();
            return state;
        }
    })();
})();