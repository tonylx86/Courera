
var
    canvas,
    gl,
    vColor,
    vPosition,
    modelView,
    projection,
    uColor,
    uOffline;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
   // gl.clearColor(0.2, 0.2, 0.2, 1.0);


    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vColor = gl.getAttribLocation(program, "vColor");
    vPosition = gl.getAttribLocation(program, "vPosition");

    modelView = gl.getUniformLocation(program, 'modelView');
    projection = gl.getUniformLocation(program, 'projection');

    uColor = gl.getUniformLocation(program,'uColor');
    uOffline = gl.getUniformLocation(program,'uOffline');

    document.getElementById("add").onclick = function () {
        viewController.addObject(document.getElementById("shape").value)
    };

    document.getElementById("remove").onclick = function () {
            viewController.remove();
    };

    document.getElementById("assemble").onclick = function () {
        viewController.assemble();
    };


    canvas.addEventListener('mousedown', function (ev) {
        viewController.onMouseDown(ev);
       // ev.preventDefault();
    });

    canvas.oncontextmenu = function (ev) {
        ev.preventDefault();
    };


    canvas.addEventListener('mouseup',function (ev) {
        viewController.onMouseUp(ev);
    });


    canvas.addEventListener('mousemove',function (ev) {


        viewController.onMouseMove(ev);

    });



    // Opera, Google Chrome and Safari
    canvas.addEventListener("mousewheel", MouseScroll, false);
    // Firefox
    canvas.addEventListener("DOMMouseScroll", MouseScroll, false);

    function MouseScroll(ev) {
        viewController.onMouseScroll(ev);
        ev.preventDefault();
    }


    window.addEventListener("keydown", function (ev) {
        viewController.onKeyDown(ev);
    });

    window.addEventListener("keyup", function (ev) {
        viewController.onKeyUp(ev);
    });


    document.getElementById("triple").onchange = function(ev) {
        if (ev.target.checked) {
            viewController.uiCtx.tripleView = true;

        }else{
            viewController.uiCtx.tripleView = false;

        }
        viewController.draw()
    };

    viewController.init();

};



