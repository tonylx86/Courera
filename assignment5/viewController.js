
viewController = function (gl,canvas, basicModels){


    var backgroundColor = vec4(0.1,0.1,0.1,1.0);
    var uiCtx = {
        action: 'translate',
        offScreen:false,

        focusID:-1,
        operatingAxis: null,


        lastCursorLoc: null, //measure in window frame
        cursorKeyDown:false,
        whichKey:null,

        attenuationA:1.0,
        attenuationB:0.03,
        attenuationC:0.001,

        animationScript:null,
    };
    var drawCtx = {};



    var camera;
    camera = new EntityNode();

    var  objects = [];
    objects.offset = -1;
    objects.max = 256;
    objects[objects.max-1] = undefined;

    var lights;
    lights = [];
    var currMaxLights = 1;


    var defaultLightSettings = {
        lightPosition : vec4(5,5,5,1 ),
        lightAmbient : vec4(0.1, 0.1, 0.1, 1.0 ),
        lightDiffuse :    vec4( 1, 1,1, 1.0 ),
        lightSpecular : vec4( 1, 1, 1, 1.0 )
    };

    var commonMaterials =  {
        materialAmbient : vec4( 1.0, 0.2, 1.0, 1 ),
        materialDiffuse : vec4( 0.9, 0.8, 0, 1),
        materialSpecular : vec4( 1, 1, 1,  1 ),
        materialShininess : 30.0
    };

    function initCamera(camera) {
        camera.translateWorld(0,0,70);
        camera.rotateWorld(45,[0,1,0]);
        camera.rotateWorld(20,[-1,0,1]);
        camera.up = [0,1,0];
        camera.lookAt = vec3(0,0,0);
        camera.fovy = 30;
        camera.aspect = canvas.width/canvas.height;
        camera.near = 20;
        camera.far =200;
        camera.viewMatrix = null;
    };




    function addLightSource(body) {

        body.lightAmbient =    defaultLightSettings.lightAmbient;
        body.lightDiffuse = defaultLightSettings.lightDiffuse;
        body.lightSpecular = defaultLightSettings.lightSpecular;
        body.isLightSource = true;
        body.isDirectional = false;
        body.turnOff = false;
        lights.push(body);

        updateLights();
    }


    function rmLightSource(body) {

        var tmp = [];
        lights.forEach(function (t) {
            if (t !== body) tmp.push(t);
        });

        lights = tmp;
        updateLights();
    }


    function updateLights() {

        if (lights.length !==  currMaxLights) {


            if (lights.length >= 20) {

                throw("reach max lights!");
            }


            program = preCompiledPrograms[lights.length];
            gl.useProgram(program);
            gl.currProgram = program;
            //setupUniformVariables(gl,program);
            //setupAttributePointers(gl,program);
            setupCamera(camera);
            setupDrawCtx(drawCtx);

        }

        if (lights.length > currMaxLights) {
            currMaxLights ++;
        }else if (lights.length < currMaxLights) {
            currMaxLights --;
        }


        var data = [];

        lights.forEach(function (light) {

            if (! light.isLightSource) { throw ("not a light source object")}

            if (! light.turnOff) {

                var pos = vec4(light.getPosition());
                if (light.isDirectional) pos[3] = 0.0;
                data.push(pos);
                data.push(light.lightAmbient);
                data.push( light.lightDiffuse);
                data.push(light.lightSpecular);

            }else{

                data.push(vec4());
                data.push(vec4());
                data.push(vec4());
                data.push(vec4());

            }
        });

        gl.uniform4fv(gl.currProgram.uniformVariables.lights, flatten(data));

        updateAttenuation();

    }

    function setupDrawCtx(drawCtx) {
        var program = gl.currProgram;
        drawCtx.gl = gl;
        drawCtx.modelMatrixLoc = program.uniformVariables.modelMatrix;
        drawCtx.normalMatrixLoc = program.uniformVariables.normalMatrix;
        drawCtx.uColor = program.uniformVariables.uColor;
        drawCtx.uFlagMonoColor = program.uniformVariables.uFlagMonoColor;

    }



    function setupCamera(camera) {
        //var attributePointers = program.attributePointers;
        var program = gl.currProgram;
        var uniformVariables = program.uniformVariables;

        var pMat = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        camera.projectionMatrix = pMat;
        //pMat = ortho(-3, 3, -3, 3, -10, 10);
        gl.uniformMatrix4fv(uniformVariables.projection,false,flatten(pMat));

        var view = lookAt(camera.getPosition(),camera.lookAt,camera.up);


        camera.viewMatrix = view;



        gl.uniformMatrix4fv(uniformVariables.viewMatrix, false,flatten(view));


        var pos = camera.getPosition();
        gl.uniform4f(uniformVariables.uEyePosition, pos[0], pos[1], pos[2], 1.0);

    }



    function addPreRenderController(body,f) {

        var controllers = body.renderControllers;
        if (controllers) {

            controllers.push(f);
        }
        else {

            body.renderControllers = [];
            body.renderControllers.push(f);
            controllers = body.renderControllers;
        }

        body.render = function (drawCtx) {

            controllers.forEach(function (e) {
                e(drawCtx);
                //console.log("!")
            });

            EntityNode.prototype.render.call(body,drawCtx);
        }

    }

    function kinematicController(body) {

        var axisX = new EntityNode(basicModels.line);

        var arrowX = new EntityNode(basicModels.cone);
        arrowX.scale(0.2,0.25,0.2);
        axisX.addComponent(arrowX,mult(translate(1,0,0),rotate(-90,[0,0,1])));

        var scaleCubeX = new EntityNode(basicModels.cube);
        scaleCubeX.scale(0.2,0.2,0.2);
        axisX.addComponent(scaleCubeX,translate(1,0,0));


        axisX.scale(1.5,1,1);



        var axisY = new EntityNode(basicModels.line);
        var arrowY = new EntityNode(basicModels.cone);


        var scaleCubeY = new EntityNode(basicModels.cube);
        scaleCubeY.scale(0.2,0.2,0.2);
        axisY.addComponent(scaleCubeY,translate(1,0,0));

        arrowY.scale(0.2,0.25,0.2);
        axisY.addComponent(arrowY,mult(translate(1,0,0),rotate(-90,[0,0,1])));
        axisY.scale(1.5,1,1);



        var axisZ = new EntityNode(basicModels.line);
        var arrowZ = new EntityNode(basicModels.cone);

        var scaleCubeZ = new EntityNode(basicModels.cube);
        scaleCubeZ.scale(0.2,0.2,0.2);
        axisZ.addComponent(scaleCubeZ,translate(1,0,0));

        arrowZ.scale(0.2,0.25,0.2);
        axisZ.addComponent(arrowZ,mult(translate(1,0,0),rotate(-90,[0,0,1])));
        axisZ.scale(1.5,1,1);


        body.addComponent(axisX, translate(1.5,0.0,0.0));
        body.addComponent(axisY, mult(translate(0, 1.5, 0.0), rotate(90, [0, 0, 1])));
        body.addComponent(axisZ, mult(translate(0, 0, 1.5), rotate(-90, [0, 1, 0])));


        var rotateBarX = new EntityNode(basicModels.disk);
        rotateBarX.scale(4,4,4);
        body.addComponent(rotateBarX, rotate(90,[0,0,1]));


        var rotateBarY = new EntityNode(basicModels.disk);
        rotateBarY.scale(4,4,4);
        body.addComponent(rotateBarY);


        var rotateBarZ = new EntityNode(basicModels.disk);
        rotateBarZ.scale(4,4,4);
        body.addComponent(rotateBarZ, rotate(-90,[1,0,0]));




        /*scale factor for off screen picking
         * need to track in case of focus changes
         * under off screen followed by a action change
         *
         */

        var sf, sf1 = {scaleFactor:1}, sf2 = {scaleFactor:1}, sf3 = {scaleFactor:1};
        var scaleFactor;

        var yellow = vec4(1.0,1.0,0.0,1.0);

        return function (drawCtx) {

            axisX.display(false);
            axisY.display(false);
            axisZ.display(false);

            rotateBarX.display(false);
            rotateBarY.display(false);
            rotateBarZ.display(false);

            var axis1,axis2,axis3,head1,head2,head3;
            var noRecursive = true;

            switch (uiCtx.action) {

                case "translate":

                    axis1 = axisX;
                    axis2 = axisY;
                    axis3 = axisZ;

                    head1 = arrowX;
                    head2 = arrowY;
                    head3 = arrowZ;

                    sf = sf1;
                    break;

                case "scale":

                    axis1 = axisX;
                    axis2 = axisY;
                    axis3 = axisZ;

                    head1 = scaleCubeX;
                    head2 = scaleCubeY;
                    head3 = scaleCubeZ;

                    sf = sf2;
                    break;

                case "rotate":

                    axis1 = rotateBarX;
                    axis2 = rotateBarY
                    axis3 = rotateBarZ
                    head1 = head2 =head3 =null;

                    break;

            }


            if (uiCtx.focusID === body.id) {

                axis1.display(true,noRecursive);
                axis2.display(true,noRecursive);
                axis3.display(true,noRecursive);


                if (uiCtx.offScreen) {

                    body.setColor(vec4((body.id+1)/255, 0.0,0.0,1.0), noRecursive);

                    if (!head1){ // it's a rotation bar
                        axis1.drawWireFrame(false);
                        axis2.drawWireFrame(false);
                        axis3.drawWireFrame(false);
                    }

                    else {
                        head1.display(true);
                        head2.display(true);
                        head3.display(true);


                        if (sf.scaleFactor === 1) {
                            scaleFactor = 2;
                            head1.scale(scaleFactor,scaleFactor,scaleFactor);
                            head2.scale(scaleFactor,scaleFactor,scaleFactor);
                            head3.scale(scaleFactor,scaleFactor,scaleFactor);
                            sf.scaleFactor = 2;

                        }
                    }

                    axis1.setColor(vec4((body.id+1)/255, 50/255, 0, 1));
                    axis2.setColor(vec4((body.id+1)/255, 100/255, 0, 1));
                    axis3.setColor(vec4((body.id+1)/255, 150/255, 0, 1));


                }

                //on screen render
                else{

                    axis1.setColor(vec4(1.0,0.0,0.0,1.0));
                    axis2.setColor(vec4(0.0,1.0,0.0,1.0));
                    axis3.setColor(vec4(0.0,0.0,1.0,1.0));
                    body.unsetColor(noRecursive);



                    if (!head1) {
                        axis1.drawWireFrame(true);
                        axis2.drawWireFrame(true);
                        axis3.drawWireFrame(true);

                    }

                    else {


                        head1.display(true);
                        head2.display(true);
                        head3.display(true);

                        if (sf.scaleFactor > 1 ) {

                            scaleFactor = 1 / sf.scaleFactor;
                            head1.scale(scaleFactor,scaleFactor,scaleFactor);
                            head2.scale(scaleFactor,scaleFactor,scaleFactor);
                            head3.scale(scaleFactor,scaleFactor,scaleFactor);

                            sf.scaleFactor = 1;


                        }


                    }


                    //check if axis is on operation
                    switch (uiCtx.operatingAxis) {

                        case 1:
                            axis1.setColor(yellow);
                            break;
                        case 2:
                            axis2.setColor(yellow);
                            break;
                        case 3:
                            axis3.setColor(yellow);
                            break;

                        default :
                            break;

                    }
                }

            }


            //not focused
            else{

                axis1.display(false);
                axis2.display(false);
                axis3.display(false);



                if(uiCtx.offScreen) {
                    body.setColor(vec4((body.id+1)/255, 0.0,0.0,1.0), noRecursive);
                }
                else {
                    body.unsetColor(noRecursive);
                }

            }



        }



    }

    function materialController(body) {


        body.materialAmbient = commonMaterials.materialAmbient;
        body.materialDiffuse = commonMaterials.materialDiffuse;
        body.materialSpecular = commonMaterials.materialSpecular;
        body.materialShininess = commonMaterials.materialShininess;

        return function () {

            var uniformVariables = gl.currProgram.uniformVariables;

            gl.uniform4fv(uniformVariables.materialAmbient,
                flatten( body.materialAmbient));
            gl.uniform4fv(uniformVariables.materialDiffuse,
                flatten(body.materialDiffuse) );
            gl.uniform4fv(uniformVariables.materialSpecular,
                flatten( body.materialSpecular) );
            gl.uniform1f(uniformVariables.shininess, body.materialShininess);

        }

   }

    function lightController(body) {


            body.scale(1/3,1/3,1/3);
            body.components.forEach(function (c) {
                c.scale(3,3,3);
            });
            body.setPosition(defaultLightSettings.lightPosition[0],
                defaultLightSettings.lightPosition[1],
                defaultLightSettings.lightPosition[2]

            );

            return function () {

                var noRecursive = true;
                if (uiCtx.offScreen) {

                    body.setColor(vec4((body.id+1)/255, 0.0,0.0,1.0), noRecursive);

                }
                else {
                    if (body.turnOff) {
                        body.setColor(vec4(0.0,0.0,0.0,1.0),noRecursive);
                    }else
                    body.setColor(body.lightDiffuse,noRecursive);
                }

            }


    }


    function addObject (shape) {

        var body;

        switch (shape) {
            case "sphere":
            {
                body = new EntityNode(basicModels.sphere);
                addPreRenderController(body,kinematicController(body));
                addPreRenderController(body,materialController(body));
                break;
            }


            case "cone":
            {
                body = new EntityNode(basicModels.cone);
                addPreRenderController(body,kinematicController(body));
                addPreRenderController(body,materialController(body));
                break;
            }

            case "cylinder":
            {
                body = new EntityNode(basicModels.cylinder);
                addPreRenderController(body,kinematicController(body));
                addPreRenderController(body,materialController(body));
                break;
            }

            case "test":
            {


                body = new EntityNode(basicModels.sphere);
                addPreRenderController(body,kinematicController(body));
                addPreRenderController(body,lightController(body));
                addLightSource(body);
                break;
            }

            case "lightSource":
            {

                body = new EntityNode(basicModels.cube);
                addPreRenderController(body,kinematicController(body));
                addPreRenderController(body,lightController(body));
                addLightSource(body);
                break;
            }
        }


        for (var i  = 0;  i < objects.max; i++) {
            if (objects[i] === undefined) {
                objects[i] = body;
                body.id = i;
                break;
            }
        }

        if (i === objects.max)  {
            console.log ("maximum objects reached!");
            return;
        }

        else if ( i > objects.offset) {
            objects.offset = i;
        }

        uiCtx.focusID = body.id;
        body.scale(2,2,2);

        updateUI();

        return body;
    };



    function rmObject(obj) {




        if (obj ) {

            //console.log(obj);

            if (obj.id === uiCtx.focusID) {
                uiCtx.focusID = -1;
            }

            if (obj.id === objects.offset) {
                objects.offset--;
            }

            objects[obj.id] = undefined;

            if (obj.isLightSource) {

                rmLightSource(obj);
            }

        }

    }




    /*
    * back buffer settings
    *
    * */

    function initFrameBufferObject() {

       var framebuffer, texture, depthBuffer;

       framebuffer = gl.createFramebuffer();
       if (!framebuffer) {
           console.log('Failed to create frame buffer object');
           return error();
       }

       texture = gl.createTexture();
       if (!texture) {
           console.log('Failed to create texture object');
           return error();
       }

       gl.bindTexture(gl.TEXTURE_2D, texture);
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

       depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
       if (!depthBuffer) {
           console.log('Failed to create renderbuffer object');
           return error();
       }

       gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
       gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);

        // Attach the texture and the renderbuffer object to the FBO




       gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
       gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
       gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

       var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
       if (gl.FRAMEBUFFER_COMPLETE !== e) {
           console.log('Frame buffer object is incomplete: ' + e.toString());
           return error();
       }

       framebuffer.texture = texture; // keep the required object


       // Unbind the buffer object
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
       gl.bindTexture(gl.TEXTURE_2D, null);
       gl.bindRenderbuffer(gl.RENDERBUFFER, null);

       return framebuffer;

   }

    function draw() {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //console.log(uiCtx.animationScript)

        if (! uiCtx.offScreen)
        {
            if (uiCtx.animationScript) {

                uiCtx.animationScript();
            }

        }




        for ( i = objects.max; i < objects.length; i++) {

            if (objects[i]) {
                objects[i].render(drawCtx);
            }
        }

        for (var i = 0; i <= objects.offset; i++) {
            if (objects[i]) {
                objects[i].render(drawCtx);
            }
        }





       if (draw.requestAnimate) {requestAnimFrame(draw);}


    };


    function initUi() {




        document.getElementById("translate").onclick = function (event) {
            uiCtx.action = "translate";

        };
        document.getElementById("scale").onclick =  function () {
            uiCtx.action ="scale";
        };
        document.getElementById("rotate").onclick = function () {
            uiCtx.action = "rotate";
        };



        canvas.addEventListener('mousedown', function (ev) {
            //ev.preventDefault();
            onMouseDown(ev);

            //console.log(pick(ev));

        });
        canvas.addEventListener('mousemove',function (ev) {
            onMouseMove(ev);
        });
        window.addEventListener('mouseup',function (ev) {
            onMouseUp(ev);
        });


        canvas.addEventListener("mousewheel", MouseScroll, false);
        // Firefox
        canvas.addEventListener("DOMMouseScroll", MouseScroll, false);

        function MouseScroll(ev) {
           onMouseScroll(ev);
            ev.preventDefault();
        }



        canvas.oncontextmenu = function (ev) {
            ev.preventDefault();
        };



    }

    var updateUI = (function () {

        return function () {

       };

    })();






    function  pick(event) {
        var d = 5;
        var a = new Uint8Array(4*d*d);
        var rect = canvas.getBoundingClientRect();
        var tmp = null;
        var candidates = [];



        gl.readPixels(event.clientX-rect.left,
            rect.bottom-event.clientY  , d, d, gl.RGBA, gl.UNSIGNED_BYTE, a);




        for (var i = 0; i < 4*d*d; i += 4) {
            if (a[i] > 0 ) {
                candidates.push(
                    {
                        r:a[i],
                        g:a[i+1],
                        b:a[i+2],
                        a:a[i+3]
                    }
                );
            }
        }

        if (candidates.length > 0) {

            tmp = candidates[0];
            for (i = 1; i < candidates.length; i++) {
                if (candidates[i].r > tmp.r)
                    tmp = candidates[i];
            }
        }
        return tmp;

    }

    function clientToDeviceCoord(v) {
        var rect = canvas.getBoundingClientRect();
        return [2*(v[0] - rect.left)/canvas.width-1,
            2*(rect.bottom-(v[1]-canvas.offsetTop))/canvas.height-1];
    }

    function clientToWindowCoord(v){
        var rect = canvas.getBoundingClientRect();
        return vec2(v[0]-rect.left, rect.bottom-v[1]);
    }

    function windowToDeviceCoord(v) {
        var rect = canvas.getBoundingClientRect();
        var cx = v[0]+rect.left;
        var cy = rect.bottom - v[1];
        return clientToDeviceCoord(vec2(cx,cy));

    }


    function onMouseDown(event) {




        draw.requestAnimate = false;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo_pick);
        gl.useProgram(program2);
        gl.currProgram = program2;
        setupDrawCtx(drawCtx);
        setupCamera(camera);
        uiCtx.offScreen = true;

        uiCtx.cursorKeyDown = true;
        uiCtx.lastCursorLoc = clientToWindowCoord(vec2(event.clientX, event.clientY));
        uiCtx.whichKey = event.which;



        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        draw();
        gl.clearColor(backgroundColor[0],backgroundColor[1],backgroundColor[2],backgroundColor[3]);


        //console.log(event.which);

        switch (uiCtx.whichKey) {

            //left click
            case 1:
                (function (){

                    var id;
                    var p = pick(event);

                    if (p ) {
                        id = p.r-1;
                        if(! objects[id] ) { console.log("picked an unlisted object!") }

                        else{

                            //uiCtx.animationScript = null;

                            if (uiCtx.focusID != id) {
                                uiCtx.action = "translate";
                            }
                            uiCtx.focusID = id;

                            updateUI();
                        }

                        if (objects[id].isLightSource) {

                        }

                    }

                    else{

                        uiCtx.focusID = -1;
                        uiCtx.operatingAxis = null;
                    }
                })();

                break;

            case 2:
                break;
            case 3:
                break;

        }


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(program3);
        gl.currProgram = program3;
        setupDrawCtx(drawCtx);
        setupCamera(camera);
        uiCtx.offScreen = false;
        draw.requestAnimate = true;

    }




    function onMouseMove(event) {

        var currLoc = clientToWindowCoord(vec2(event.clientX, event.clientY));



        if (uiCtx.cursorKeyDown) {


            if (uiCtx.operatingAxis) {

                (function () {
                    var delta,dx,dy;
                    delta = subtract(currLoc ,uiCtx.lastCursorLoc);

                    dx = delta[0];
                    dy = delta[1];

                    if (Math.abs(dx) < 2 && Math.abs(dy) < 2)  return;

                    switch (uiCtx.action) {

                        case "translate":

                            screenTranslate(currLoc);
                            break;
                        case "rotate":
                            screenRotate(currLoc);
                            break;
                        case "scale":

                            screenScale(currLoc);
                            break;

                    }

                    uiCtx.lastCursorLoc = currLoc;

                    //setup lights


                })();

                if (objects[uiCtx.focusID].isLightSource) {
                    updateLights();
                }
                updateUI();

            }

            else {


                (function () {

                    var delta,dx,dy;
                    delta = subtract(currLoc ,uiCtx.lastCursorLoc);

                    dx = delta[0];
                    dy = delta[1];

                    if (Math.abs(dx) < 2 && Math.abs(dy) < 2)  return;

                    switch (uiCtx.whichKey) {

                        case 1:

                            (function (camera){

                                var step = 0.4;

                                if (Math.abs(dx) > 0.0) {
                                    var angle =  dx > 0? -step:step;

                                    camera.translateWorld( -camera.lookAt[0], -camera.lookAt[1],-camera.lookAt[2]);
                                    camera.rotateWorld(angle,[0,1,0]);
                                    camera.translateWorld( camera.lookAt[0], camera.lookAt[1],camera.lookAt[2]);
                                    //camera.up = rightApplyMatrix(mat43(camera.modelMatrix), [0,1,0]);

                                }

                                if(Math.abs(dy) > 0.0) {

                                    //var u = subtract(camera.lookAt, camera.getPosition());
                                    //var v =  camera.up;
                                    //var w = cross(u,v);
                                    //var up = rightApplyMatrix(mat43(rotate(angle,w)), camera.up);

                                    angle =   dy > 0? step:-step;
                                    var u = subtract(camera.getPosition(),camera.lookAt );
                                    var v = [0,1,0];
                                    var w = cross(v,u);
                                    var up = cross(u,w);
                                    up = rightApplyMatrix(mat43(rotate(angle,w)), up);

                                    if (dot(up, [0,1,0]) > 0.0) {


                                        camera.translateWorld( -camera.lookAt[0], -camera.lookAt[1],-camera.lookAt[2]);
                                        camera.rotateWorld(angle,w);
                                        camera.translateWorld( camera.lookAt[0], camera.lookAt[1],camera.lookAt[2]);
                                        //camera.up = rightApplyMatrix(mat43(camera.modelMatrix), [0,1,0]);
                                    }
                                }

                                uiCtx.lastCursorLoc = currLoc;
                                setupCamera(camera);

                            })(camera);

                            break;
                        case 2:
                            break;

                        case 3:

                            (function (camera) {



                                var rv = transpose(mat43(camera.viewMatrix));
                                delta = rightApplyMatrix(rv,vec3(delta[0],delta[1],0));


                                var u = subtract(camera.getPosition(),camera.lookAt );
                                var v = [0,1,0];
                                var w = normalize(cross(v,u));


                                var up = normalize(cross(u,w));
                                var t = scale(-0.05,vec3(delta[0],delta[1],delta[2]));

                                t = add(scale(dot(up,t),up), scale(dot(w,t),w));
                                //var tx = w[0]*product;
                                //var ty = w[1]*product + t[1];
                                //var tz = w[2]*product;


                                camera.translateWorld(t[0],t[1],t[2]);
                                camera.lookAt = add(camera.lookAt,vec3(t[0],t[1],t[2]));

                                setupCamera(camera);


                               // setupCamera(camera,gl.currProgram);
                                uiCtx.lastCursorLoc = currLoc;


                            })(camera);


                            break
                    }

                })();

            }


        }


        else if (uiCtx.focusID >= 0) {



            (function () {
                draw.requestAnimate = false;
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo_pick);
                gl.useProgram(program2);
                gl.currProgram = program2;

                setupDrawCtx(drawCtx);
                setupCamera(camera);
                uiCtx.offScreen = true;


                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                draw();
                gl.clearColor(backgroundColor[0],backgroundColor[1],backgroundColor[2],backgroundColor[3]);


                var p = pick(event);


                if (p && p.r-1 === uiCtx.focusID) {

                    //console.log(p);
                    switch (p.g) {
                        case 50:
                            uiCtx.operatingAxis = 1;
                            break;
                        case 100:
                            uiCtx.operatingAxis = 2;
                            break;
                        case 150:
                            uiCtx.operatingAxis = 3;
                            break;
                        default :
                            uiCtx.operatingAxis = null;

                            break;
                    }
                }

                else {

                    uiCtx.operatingAxis = null;
                }


                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.useProgram(program3);
                gl.currProgram = program3;

                setupDrawCtx(drawCtx);
                setupCamera(camera);
                uiCtx.offScreen = false;
                draw.requestAnimate = true;

            })();


        }





    }

    function  onMouseUp(event){

        uiCtx.cursorKeyDown = false;
        uiCtx.whichKey = null;
        //uiCtx.operatingAxis = null;
        uiCtx.lastCursorLoc = null;
        //console.log(event.which);
    }


    function onMouseScroll(ev) {

        // if (ev.preventDefault) {ev.preventDefault();}
        //else {ev.returnValue = false;}


        var rolled = 0;
        if ('wheelDelta' in ev) {
            rolled = ev.wheelDelta;
        }
        else {  // Firefox
            // The measurement units of the detail and wheelDelta properties are different.
            rolled = -40 * ev.detail;
        }

        //camera.translate(0,0,rolled*0.05);
        var delta = rolled*0.01;
        if ( (camera.fovy + delta) > 0 && (camera.fovy + delta) < 180) {

            camera.fovy += delta;
            setupCamera(camera);
        }



    }


    function screenTranslate(currLoc) {

        var obj = objects[uiCtx.focusID];
        var axis,modelMatrix,viewMatrix,projectionMatrix;

        modelMatrix = obj.modelMatrix;
        viewMatrix = camera.viewMatrix;
        projectionMatrix = camera.projectionMatrix;

        switch (uiCtx.operatingAxis) {

            case 1:
                axis = [1,0,0,1];
                break;
            case 2:
                axis = [0,1,0,1];
                break;
            case 3:
                axis = [0,0,1,1];
                break;

        }

        var mvp = mult(projectionMatrix, mult(viewMatrix,modelMatrix));

        var direction = subtract(rightApplyMatrix(mvp,axis), rightApplyMatrix(mvp,[0,0,0,1]));
        direction = normalize(vec2(direction));

        var d = normalize(subtract(currLoc , uiCtx.lastCursorLoc)) ;

        var delta = dot(d,direction) * 0.08;

        switch (uiCtx.operatingAxis) {

            case 1:
                obj.translate(delta,0,0);
                break;
            case 2:
                obj.translate(0,delta,0);
                break;
            case 3:
                obj.translate(0,0,delta);
                break;

        }

    }

    function screenScale(currLoc){
        var obj = objects[uiCtx.focusID];
        var axis,modelMatrix,viewMatrix,projectionMatrix;

        modelMatrix = obj.modelMatrix;
        viewMatrix = camera.viewMatrix;
        projectionMatrix = camera.projectionMatrix;

        switch (uiCtx.operatingAxis) {

            case 1:
                axis = [1,0,0,1];
                break;
            case 2:
                axis = [0,1,0,1];
                break;
            case 3:
                axis = [0,0,1,1];
                break;

        }

        var mvp = mult(projectionMatrix, mult(viewMatrix,modelMatrix));

        var direction = subtract(rightApplyMatrix(mvp,axis), rightApplyMatrix(mvp,[0,0,0,1]));
        direction = normalize(vec2(direction));

        var d = normalize(subtract(currLoc , uiCtx.lastCursorLoc)) ;

        var delta = dot(d,direction) * 0.01;

        switch (uiCtx.operatingAxis) {

            case 1:
                obj.scale(1+delta,1,1);
                break;
            case 2:
                obj.scale(1,1+delta,1);
                break;
            case 3:
                obj.scale(1,1,1+delta);
                break;

        }


    }


    function screenRotate(currLoc) {

        var obj = objects[uiCtx.focusID];
        var axis,modelMatrix,viewMatrix,projectionMatrix;

        modelMatrix = obj.modelMatrix;
        viewMatrix = camera.viewMatrix;
        projectionMatrix = camera.projectionMatrix;

        switch (uiCtx.operatingAxis) {

            case 1:
                axis = [1,0,0,1];
                break;
            case 2:
                axis = [0,1,0,1];
                break;
            case 3:
                axis = [0,0,1,1];
                break;

        }

        var mvp = mult(projectionMatrix,mult(viewMatrix,modelMatrix));

        var v1 = rightApplyMatrix(mvp, axis);
        v1 = scale(1/v1[3], v1);

        var v0 = rightApplyMatrix(mvp, [0,0,0,1]);
        v0 = scale(1/v0[3], v0);


        //console.log(v1,v0);

        var prev = subtract(
            vec3(windowToDeviceCoord(uiCtx.lastCursorLoc)),
            vec3(v0[0],v0[1],0)
        );

        var curr= subtract(
            vec3(windowToDeviceCoord(currLoc)),
            vec3(v0[0],v0[1],0)
        );


        var product = cross(prev,curr);


        if (v1[2] - v0[2] < -1/1000) {

            if (product[2] > 0.0) {
                obj.rotate(0.5, vec3(axis));
            }
            else if(product[2] < 0.0) {
                obj.rotate(-0.5, vec3(axis));
            }

        }
        else if (v1[2] - v0[2] > 1/1000){

            if (product[2] > 0.0) {
                obj.rotate(-0.5, vec3(axis));
            }
            else if(product[2] < 0.0) {
                obj.rotate(0.5, vec3(axis));
            }

        }
        else {

            var direction =subtract(vec3(v1),vec3(v0));
            var d = vec3(subtract(curr,prev));
            var sign=  cross(d,direction)[2]>0?1:-1;
            obj.rotate( sign * 0.5  ,vec3(axis));
        }


    }





    function initDefaultObjects() {

        //var grid;
        // grid = new EntityNode(basicModels.grid);
        //var color = vec4(0.6,0.6,0.6,1);
        //grid.setColor(color);
        ////grid.setScale(5,1,5);
        //objects.push(grid);
        //grid.render = function (drawCtx) {
        //
        //    if (!uiCtx.offScreen) {
        //        EntityNode.prototype.render.call(this,drawCtx);
        //    }
        //
        //}
        //
        //var ambient = new EntityNode();
        //addLightSource(ambient);
        //ambient.lightAmbient = vec4(0.15,0.15,0.15);
        //ambient.lightDiffuse = vec4(0,0,0,1 );
        //ambient.lightSpecular = vec4(0,0,0,1);
        //ambient.display(false);


        //var numEvents = 1;
        //var allReady = 0;


        var earthTex, checkBoardTex,cubeMap;




        var image = document.getElementById("earth");
        earthTex = loadTexture( image);

        function loadTexture(image) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image's y axis
            // Enable texture unit0
            // gl.activeTexture(gl.TEXTURE0);

            var texture = gl.createTexture();
            // Bind the texture object to the target
            gl.bindTexture(gl.TEXTURE_2D, texture);


            // Set the texture parameters

            // Set the texture image
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

            gl.texParameterf(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

            gl.generateMipmap(gl.TEXTURE_2D);

            gl.bindTexture(gl.TEXTURE_2D, null);

            return texture;

        }

        var texSize = 128;

        var checkBoardImg = (function () {

            var image1 = new Array();
            for (var i =0; i<texSize; i++)  image1[i] = new Array();
            for (var i =0; i<texSize; i++)
                for ( var j = 0; j < texSize; j++)
                    image1[i][j] = new Float32Array(4);
            for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
                var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
                image1[i][j] = [c, c, c, 1];
            }

// Convert floats to ubytes for texture

            var image2 = new Uint8Array(4*texSize*texSize);

            for ( var i = 0; i < texSize; i++ )
                for ( var j = 0; j < texSize; j++ )
                    for(var k =0; k<4; k++)
                        image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


            return image2;
        })();


        function configureTexture(image) {
            var texture = gl.createTexture();
            //gl.activeTexture( gl.TEXTURE0 );
            gl.bindTexture( gl.TEXTURE_2D, texture );
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap( gl.TEXTURE_2D );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                gl.NEAREST_MIPMAP_LINEAR );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

            gl.bindTexture(gl.TEXTURE_2D, null);

            return texture;

        }


        checkBoardTex = configureTexture(checkBoardImg);

        gl.uniform1i(gl.currProgram.uniformVariables.u_Sampler,0);


        var sp1 = addObject("sphere");

        sp1.setScale(4,4,4);
        sp1.translateWorld(-15,0,0);

        var sp2 = addObject("sphere");
        sp2.setScale(4,4,4);
        sp2.translateWorld(15,0,0);

        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(sp1.model.part1.texCoord.data),gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.currProgram.attributePointers.aTexCoord,2,gl.FLOAT,false,0,0);
        gl.enableVertexAttribArray(gl.currProgram.attributePointers.aTexCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);

        addPreRenderController(sp1, function () {

            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.vertexAttribPointer(gl.currProgram.attributePointers.aTexCoord,2,gl.FLOAT,false,0,0);
           gl.enableVertexAttribArray(gl.currProgram.attributePointers.aTexCoord);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,earthTex);
        })

        addPreRenderController(sp2, function () {

            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.vertexAttribPointer(gl.currProgram.attributePointers.aTexCoord,2,gl.FLOAT,false,0,0);
            gl.enableVertexAttribArray(gl.currProgram.attributePointers.aTexCoord);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,checkBoardTex);
        })



        function configureCubeMap() {

            var ready  =  0;
            var cubeMap = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);


            function configureTexture( image, face ) {
                ready ++;
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D( face, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );

                if (ready == 6) {


                    gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
                    gl.uniform1i(gl.currProgram.uniformVariables.uCubeSampler,1);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);


                   //allReady ++;
                   // if (allReady === numEvents) {
                   //     draw();
                   // }
                }

            }


            //var front = new Image();
            //
            //front.onload = function () {
            //    configureTexture(front, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
            //
            //
            //};
            //front.src = "./skybox/front.jpg";

            var front = document.getElementById("front");
            configureTexture(front, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);

            //var back = new Image();
            //back.onload = function () {
            //    configureTexture(back, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
            //
            //
            //};
            //back.src = "./skybox/back.jpg";


            var back = document.getElementById("back");
            configureTexture(back, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);

            //var up = new Image();
            //up.onload = function () {
            //    configureTexture(up, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
            //
            //
            //}
            //up.src = "./skybox/up.jpg";

            var up =  document.getElementById("up");
            configureTexture(up, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);

            //var down = new Image();
            //down.onload = function () {
            //    configureTexture(down,gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
            //
            //}
            //down.src = "./skybox/down.jpg";

            var down = document.getElementById("down");
            configureTexture(down,gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);

            //var left = new Image();
            //left.onload = function () {
            //    configureTexture(left,gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
            //
            //}
            //left.src = "./skybox/left.jpg";

            var left = document.getElementById("left");
            configureTexture(left,gl.TEXTURE_CUBE_MAP_NEGATIVE_X);

            //var right = new Image();
            //right.onload = function () {
            //    configureTexture(right,gl.TEXTURE_CUBE_MAP_POSITIVE_X);
            //
            //}
            //right.src = "./skybox/right.jpg";

            var right = document.getElementById("right");
            configureTexture(right,gl.TEXTURE_CUBE_MAP_POSITIVE_X);

            return cubeMap;
        }

       cubeMap = configureCubeMap();

        gl.uniform1i(gl.currProgram.uniformVariables.uCubeSampler,1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        gl.uniform1f(gl.currProgram.uniformVariables.uFlagCubeTex, 0.0);

        var cube = new EntityNode(basicModels.cube);
        cube.setScale(1,1,1);

        function drawSkyBox() {



            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
            gl.uniform1f(gl.currProgram.uniformVariables.uFlagCubeTex, 1.0);


            var savedFovY = camera.fovy;
            var savedNear = camera.near;
            var savedFar = camera.far;
            var savedAspect = camera.aspect;
            var eyePos = camera.getPosition();
            camera.fovy = 90;
            camera.near = 0.4;
            camera.far = 1.7;
            camera.aspect = 1;
            cube.setPosition(eyePos[0],eyePos[1],eyePos[2]);

            setupCamera(camera);
            cube.render(drawCtx);
           // console.log(drawCtx);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

            gl.uniform1f(gl.currProgram.uniformVariables.uFlagCubeTex, 0.0);
            camera.fovy = savedFovY;
            camera.near = savedNear;
            camera.far = savedFar;
            camera.aspect = savedAspect;
            setupCamera(camera);


        }


        var reflectBall = new EntityNode(basicModels.sphere);
        reflectBall.setScale(5,5,5);
        function drawReflectBall() {

            gl.useProgram(program4);
            gl.currProgram = program4;
            setupCamera(camera);
            setupDrawCtx(drawCtx);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
            gl.uniform1i(gl.currProgram.uniformVariables.uCubeSampler,1);

            reflectBall.render(drawCtx);

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

            gl.useProgram(program3);
            gl.currProgram = program3;
            setupCamera(camera);
            setupDrawCtx(drawCtx);

        }


        uiCtx.animationScript = function () {
            drawSkyBox();
            drawReflectBall();

        };



        draw.requestAnimate = true;
        draw();

    }


    function updateAttenuation() {
        gl.uniform1f(gl.currProgram.uniformVariables.attenuationA, uiCtx.attenuationA);
        gl.uniform1f(gl.currProgram.uniformVariables.attenuationB, uiCtx.attenuationB);
        gl.uniform1f(gl.currProgram.uniformVariables.attenuationC, uiCtx.attenuationC);
    }



    /*
    * init
    * */




    var fbo_pick = initFrameBufferObject();
    var program2 =  initShaders(gl, "vertex-shader-off", "fragment-shader-off");
    program2.attributePointers = {
        vPosition:undefined,
        //vNormal:undefined
    };
    program2.uniformVariables = {
        //modelView :undefined,
        projection :undefined,
        uColor :undefined,
        modelMatrix:undefined,
        viewMatrix:undefined,
    };
    setupUniformVariables(gl,program2);
    setupAttributePointers(gl,program2);
   // gl.useProgram(program2);


    var program = initShadersFromJs(gl,vertexShaderTemplate,fragmentShaderTemplate);
    program.attributePointers = {
        vPosition:undefined,
        vNormal:undefined,

        vSpeed:undefined,
        vSelfRotationAxis:undefined,
        vSelfRotationRate:undefined

    };
    program.uniformVariables =  {
        projection :undefined,
        uColor :undefined,
        uFlagMonoColor :undefined,

        uBoom:undefined,
        uDeltaTime:undefined,

        materialAmbient:undefined,
        materialDiffuse:undefined,
        materialSpecular:undefined,

        normalMatrix:undefined,
        modelMatrix:undefined,
        viewMatrix:undefined,
        eyePosition:undefined,

        shininess:undefined,
        lights:undefined,

        attenuationA:undefined,
        attenuationB:undefined,
        attenuationC:undefined
    };

    //gl.useProgram(program);
    //gl.currProgram = program;
    setupUniformVariables(gl,program);
    setupAttributePointers(gl,program);



    var program3 = initShaders(gl,"vertex-shader-tex","fragment-shader-tex");
    program3.attributePointers = {
        vPosition:undefined,
        aTexCoord:undefined

    };
    program3.uniformVariables = {
        projection :undefined,
        uColor :undefined,
        uFlagMonoColor :undefined,
        modelMatrix:undefined,
        viewMatrix:undefined,
        u_Sampler:undefined,
        uFlagCubeTex:undefined,
        uCubeSampler:undefined,
        uEyePosition:undefined,

    };

    gl.useProgram(program3);
    gl.currProgram = program3;
    setupUniformVariables(gl,program3);
    setupAttributePointers(gl,program3);


    var program4 =  initShaders(gl,"vertex-shader-reflect","fragment-shader-reflect");
    program4.attributePointers = {
        vPosition:undefined,
        vNormal:undefined,

    };
    program4.uniformVariables = {
        projection :undefined,
        modelMatrix:undefined,
        normalMatrix:undefined,
        viewMatrix:undefined,
        uCubeSampler:undefined,
        uEyePosition:undefined,
    };
    setupUniformVariables(gl,program4);
    setupAttributePointers(gl,program4);


    //var preCompiledPrograms = [null,program];
    //(function () {
    //    for (var i = 2; i < 20; i++) {
    //
    //        var vp = vertexShaderTemplate.replace('const int maxLights = 1', 'const int maxLights = ' + i);
    //
    //        var fp = fragmentShaderTemplate.replace('const int maxLights = 1', 'const int maxLights = ' + i);
    //
    //        var p;
    //        p = initShadersFromJs(gl,vp,fp);
    //        p.attributePointers = {
    //            vPosition:undefined,
    //            vNormal:undefined,
    //
    //            vSpeed:undefined,
    //            vSelfRotationAxis:undefined,
    //            vSelfRotationRate:undefined
    //
    //        };
    //        p.uniformVariables =  {
    //            projection :undefined,
    //            uColor :undefined,
    //            uFlagMonoColor :undefined,
    //            lightPositions:undefined,
    //
    //
    //            uBoom:undefined,
    //            uDeltaTime:undefined,
    //
    //            materialAmbient:undefined,
    //            materialDiffuse:undefined,
    //            materialSpecular:undefined,
    //
    //            normalMatrix:undefined,
    //            modelMatrix:undefined,
    //            viewMatrix:undefined,
    //            eyePosition:undefined,
    //
    //            shininess:undefined,
    //            lights:undefined,
    //
    //            attenuationA:undefined,
    //            attenuationB:undefined,
    //            attenuationC:undefined
    //        };
    //        setupUniformVariables(gl,p);
    //        setupAttributePointers(gl,p);
    //
    //        preCompiledPrograms.push(p);
    //
    //    }
    //
    //})();


    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    //gl.enable(gl.POLYGON_OFFSET_FILL);
   //gl.polygonOffset(1.0, 1.0);
    //gl.enable(gl.CULL_FACE);
    gl.clearColor(backgroundColor[0],backgroundColor[1],backgroundColor[2],backgroundColor[3]);
    //gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);









    initUi();
    updateUI();

    initCamera(camera);
    setupCamera(camera);
    setupDrawCtx(drawCtx);


    updateAttenuation();
    initDefaultObjects();













}


function rightApplyMatrix(m,v) {

    var ret = [];
   for(var i = 0; i < v.length; i++) {

       ret.push( dot(m[i],v));

   }

    return ret;
}

function mat43(m) {
    return mat3(
        [m[0][0],m[0][1],m[0][2]],
        [m[1][0],m[1][1],m[1][2]],
        [m[2][0],m[2][1],m[2][2]]
    )
}

function initShadersFromJs( gl, v, f )
{
     var vertShdr;
     var fragShdr;


        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, v );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }

        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, f );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16)/255,
        parseInt(result[2], 16)/255,
        parseInt(result[3], 16)/255,
        1.0
    ] : null;
}

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }


    return "#" + componentToHex(Math.ceil(r*255)) + componentToHex(Math.ceil(g*255)) + componentToHex(Math.ceil(b*255));
}



var vertexShaderTemplate = '\
attribute  vec4 vPosition;\n\
const int maxLights = 1;\n\
attribute  vec3 vNormal;\n\
uniform mat3 normalMatrix;\n\
uniform vec4 eyePosition;\n\
uniform mat4 modelMatrix;\n\
uniform mat4 viewMatrix;\n\
uniform mat4 projection;\n\
\n\
attribute vec3 vSpeed;\n\
attribute vec3 vSelfRotationAxis;\n\
attribute float  vSelfRotationRate;\n\
uniform float uBoom;\n\
uniform float uDeltaTime;\n\
\n\
const int stride = 4;\n\
varying vec3 L_vectors[maxLights];\n\
uniform vec4 lights[maxLights*stride];\n\
varying vec3 N,E,R;\n\
\n\
void computeL(in vec4 lightPosition, out vec3 L)\n\
{\n\
    if (lightPosition.a == 0.0) {\n\
        L =  lightPosition.xyz ;\n\
    }\n\
    else {\n\
        L = ( lightPosition - modelMatrix * vPosition ).xyz;\n\
    }\n\
}\n\
\n\
mat4 rotate(in float angle, in vec3 axis) {\n\
\n\
    vec3 v = normalize(axis);\n\
    float x = v.x;\n\
    float y = v.y;\n\
    float z = v.z;\n\
\n\
    float c = cos(radians(angle));\n\
    float omc = 1.0 -c;\n\
    float s = sin(radians(angle));\n\
\n\
    mat4 result = mat4(\n\
        vec4(x*x*omc + c, x*y*omc + z*s, x*z*omc - y*s, 0.0),\n\
        vec4(x*y*omc - z*s, y*y*omc + c, y*z*omc + x*s, 0.0),\n\
        vec4(x*z*omc + y*s, y*z*omc - x*s, z*z*omc + c, 0.0),\n\
        vec4(0.0,0.0,0.0,1.0));\n\
    return result;\n\
}\n\
\n\
void main()\n\
{\n\
\n\
          N = normalize ( normalMatrix * vNormal ) ;\n\
         vec4 pos;\n\
         if (uBoom > 0.0) { pos =  modelMatrix *rotate( uDeltaTime * vSelfRotationRate, vSelfRotationAxis) *vPosition;\n\
          pos.xyz = pos.xyz + uDeltaTime*length(vSpeed)*N; \n\
          }\n\
         else {pos = modelMatrix * vPosition;}\n\
        E = normalize( (eyePosition - pos).xyz );\n\
\n\
        R = reflect(-E,N);\n\
\n\
        for (int i =0 ; i < maxLights; i ++) {\n\
            computeL(lights[i*stride], L_vectors[i]);\n\
        }\n\
\n\
    \n\
    gl_Position = projection * viewMatrix * pos;\n\
    \n\
    gl_PointSize = 10.0;\n\
    \n\
} ';

var fragmentShaderTemplate = '\
precision highp float;\n\
const int maxLights = 1;\n\
const int stride = 4;\n\
\n\
varying vec3  L_vectors[maxLights];\n\
uniform vec4 lights[maxLights*stride];\n\
uniform float shininess;\n\
uniform vec4  materialDiffuse, materialSpecular, materialAmbient;\n\
uniform float attenuationA,attenuationB,attenuationC;\n\
uniform vec4 uColor;\n\
uniform float uFlagMonoColor;\n\
\n\
uniform samplerCube texMap;\n\
varying vec3 N,E,R;\n\
    \n\
struct light {\n\
    vec4 position;\n\
    vec4 ambient;\n\
    vec4 diffuse;\n\
    vec4 specular;\n\
};\n\
    vec4  computeLight2(in light t, in vec3 L) {\n\
    float af = 1.0/(attenuationA+attenuationB*length(L)+attenuationC*length(L)*length(L));\n\
    L = normalize(L);\n\
    vec4 diffuseProduct = t.diffuse * materialDiffuse;\n\
    vec4  specularProduct = t.specular * materialSpecular;\n\
    vec4  ambientProduct = t.ambient * materialAmbient;\n\
\n\
    float Kd = max( dot(L, N), 0.0 );\n\
    vec4  diffuse = Kd*diffuseProduct;\n\
\n\
    vec3 H = normalize( L + E );\n\
    float Ks =  pow( max(dot(N, H), 0.0), shininess );\n\
    vec4  specular = Ks * specularProduct;\n\
\n\
    if( dot(L, N) < 0.0 ) {\n\
        specular = vec4(0.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
    return af * (diffuse + specular + ambientProduct);\n\
}\n\
\n\
void main()\n\
{\n\
    if (uFlagMonoColor > 0.0)\n\
    { gl_FragColor = uColor; }\n\
\n\
    else\n\
    {\n\
\n\
        vec4 fColor;\n\
        light light;\n\
\n\
        for (int i = 0; i < maxLights; i++) {\n\
\n\
        light.position = lights[i*stride];\n\
        light.ambient = lights[i*stride+1];\n\
        light.diffuse = lights[i*stride+2];\n\
        light.specular = lights[i*stride+3];\n\
\n\
        fColor += computeLight2(light,  L_vectors[i]);\n\
\n\
    }\n\
\n\
        fColor.a = 1.0;\n\
        gl_FragColor = fColor;\n\
\n\
    }\n\
\
}';

