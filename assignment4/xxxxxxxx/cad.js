

function setupUniformVariables(gl,program) {

    var uniformVariables = program.uniformVariables;
    var loc;
    for (var t in uniformVariables) {

        loc = gl.getUniformLocation(program,t);

        if (loc === -1) {
            throw (t + " is not an active uniform variable");
        }

        uniformVariables[t] = loc;

    }


}

function setupAttributePointers(gl,program) {
    var loc;
    var attributePointers = program.attributePointers;
    for (var name in attributePointers) {
        loc = gl.getAttribLocation(program,name);
        if (loc === -1) {
            throw (name + " is not an active vertex variable");
        }
        attributePointers[name] = loc;
    }
}


function setupModelsBuffer(gl,models) {

    for (var m in models) {
        setupModelBuffer(models[m]);
        //setupModelRender(models[m]);
    }

    function setupModelBuffer(model)
    {
        /*
         * interleave attribute datas
         * use float to store attributes
         * use unsigned short to store indices
         */

        var partName;

        for (partName in model) {


            //setup vertices and normals
            (function () {

                var vertices = model[partName].vertices;
                var normals = model[partName].normals;

                vertices.buffer = gl.createBuffer();
                vertices.offset = 0;

                if (normals === undefined) {
                    vertices.stride = 0;
                    gl.bindBuffer( gl.ARRAY_BUFFER,  vertices.buffer);
                    gl.bufferData(
                        gl.ARRAY_BUFFER,
                        flatten(vertices.data),
                        gl.STATIC_DRAW
                    );

                }

                else{

                    if (vertices.data.length !== normals.data.length) {
                        throw (partName + " vertices and normals don't match");
                        //vertices.stride = 0;
                        //vertices.offset = 0;
                        //normals.stride = 0;
                        //normals.offset = vertices.data.length * vertices.dimension * 4;
                        //
                        //
                        //gl.bindBuffer( gl.ARRAY_BUFFER,  vertices.buffer);
                        //gl.bufferData(
                        //    gl.ARRAY_BUFFER,
                        //    flatten(vertices.data.concat(normals.data)),
                        //    gl.STATIC_DRAW
                        //);

                    }

                    else {

                        vertices.stride = vertices.dimension * 4 + normals.dimension*4;
                        normals.stride = vertices.stride;
                        normals.offset = vertices.dimension * 4;

                        var interleavedData = [];

                        (function () {
                            for (var i =0; i < vertices.data.length; i++) {
                                interleavedData.push(vertices.data[i]);
                                interleavedData.push(normals.data[i]);
                            }

                        })();


                        gl.bindBuffer( gl.ARRAY_BUFFER,  vertices.buffer);
                        gl.bufferData(
                            gl.ARRAY_BUFFER,
                            flatten(interleavedData),
                            gl.STATIC_DRAW
                        );
                    }



                }
            })();

            //setup indices

            (function () {

                var indices = model[partName].indices;
                if (indices === undefined || indices.length == 0) return;


                indices.buffer = gl.createBuffer();

                var offset = 0, data = [];
                for (var i = 0; i < indices.length; i++) {

                    if (indices[i].glMode === undefined) continue;

                    indices[i].offset = offset;
                    data = data.concat(indices[i].data);
                    offset += indices[i].data.length * 2;
                }

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(data),
                    gl.STATIC_DRAW
                );

            }) ();

        }



    }

}

function setupModelsRender(gl,models) {
    for (var m in models) {
        //setupModelBuffer(models[m]);
        setupModelRender(models[m]);
    }

    function setupModelRender(model)
    {

        function render(ctx) {

            var attributePointers = gl.currProgram.attributePointers;

            if (ctx !== undefined) {
                var wireFrame = ctx.wireFrame;

            }

            function filterForWireFrame(t) {
                if (wireFrame === true) {
                    if (t.description == "wireFrame") return t;
                } else {
                    if (t.description !== "wireFrame") return t;
                }
            }

            for (var partName in this) {

                var part = this[partName];

                if (part.vertices === undefined) continue;


                (function () {

                    var vertices = part.vertices;


                    if (! vertices.buffer) throw(partName + " buffer not setup!");
                    gl.bindBuffer(gl.ARRAY_BUFFER, vertices.buffer);


                    gl.vertexAttribPointer(
                        attributePointers.vPosition,
                        vertices.dimension,
                        gl.FLOAT,
                        false,
                        vertices.stride,
                        vertices.offset
                    );
                    gl.enableVertexAttribArray(attributePointers.vPosition);

                    if (attributePointers.vNormal) {

                        if (part.normals ) {
                            var normals = part.normals;
                            gl.vertexAttribPointer(
                                attributePointers.vNormal,
                                normals.dimension,
                                gl.FLOAT,
                                false,
                                normals.stride,
                                normals.offset
                            );

                            gl.enableVertexAttribArray(attributePointers.vNormal);

                        }
                    }



                    if (vertices.glMode  !==  undefined   && !wireFrame ) {

                        gl.drawArrays(gl[vertices.glMode], 0, vertices.data.length);
                    }

                })();

                (function () {


                    if (part.indices === undefined ) return;

                    var iBuffer = part.indices.buffer;
                    if (iBuffer === undefined) {
                        throw("model has not setup");
                    }

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

                    part.indices.filter(filterForWireFrame).forEach(function (info) {
                        if (info.glMode)
                            gl.drawElements(
                                gl[info.glMode],
                                info.data.length,
                                gl.UNSIGNED_SHORT,
                                info.offset
                            )
                    });

                }) ();

                gl.disableVertexAttribArray(attributePointers.vNormal);
                gl.disableVertexAttribArray(attributePointers.vPosition);

            }
        }


        model.render = render;

    }
}




function windowInit() {
    var
        canvas,hud,
        gl;

    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);



    //hud = document.getElementById("hud");
    //var ctx = hud.getContext('2d');
    //ctx.font = '18px "Times New Roman" ';
    //ctx.fillStyle = 'rgba(0,255,0,1)';
    //ctx.fillText('!!!!!!!!!!! ', 10,10);




    var basicModels = {

        grid:_Grid(),
        sphere:_Sphere(),
        cone:_Cone(),
        triangle:_Triangle(),
        cylinder:_Cylinder(),
        square:_Square(),
        cube:_Cube(),
        line:_Line(),
        disk:_Disk()

    };

    setupModelsBuffer(gl,basicModels);
    setupModelsRender(gl,basicModels);

    function test() {

        var testEntity,testEntity2,testCtx;
        var w = 10;
        gl.uniformMatrix4fv(uniformVariables.projection,false,flatten(ortho(-w, w, -w * 800 / 1280, w * 800 / 1280, -10, 100)));
        //gl.uniform1f(uniformVariables.uOffline,1.0);
        // gl.uniform4f(uniformVariables.uColor,1.0,1.0,0.0,1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        //gl.uniformMatrix4fv(uniformVariables.modelView, false,flatten(lookAt([1,1,1],[0,0,0],[0,1,0])));

        var lightPosition = vec4(0,0,5,0 );
        var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
        var lightDiffuse = vec4( 1, 1, 1, 1.0 );
        var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

        var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
        var materialDiffuse = vec4( 1, 0.8, 0.0, 1.0);
        var materialSpecular = vec4( 1, 1, 1, 1.0 );
        var materialShininess = 30.0;

        var ambientProduct = mult(lightAmbient, materialAmbient);
        var diffuseProduct = mult(lightDiffuse, materialDiffuse);
        var specularProduct = mult(lightSpecular, materialSpecular);

        gl.uniform4fv(uniformVariables.ambientProduct,
            flatten(ambientProduct));
        gl.uniform4fv(uniformVariables.diffuseProduct,
            flatten(diffuseProduct) );
        gl.uniform4fv(uniformVariables.specularProduct,
            flatten(specularProduct) );
        gl.uniform4fv(uniformVariables.lightPosition,
            flatten(lightPosition) );


        gl.uniform1f(uniformVariables.shininess,materialShininess);





        testCtx = {
            uModel:uniformVariables.modelMatrix,
            viewMatrix:lookAt([2,2,2],[0,0,0],[0,1,0]),
            gl:gl,
            normalMatrixLoc:uniformVariables.normalMatrix
        };



        testEntity2 = new EntityNode(basicModels.triangle);
        //testEntity2.setPosition(-2,3,7);
        //testEntity2.drawWireFrame(true);
        testEntity2.render(testCtx);


        var m =  transpose(inverse(lookAt([2,2,2],[0,0,0],[0,1,0])));
        //console.log(
        //    dot(lookAt([2,2,2],[0,0,0],[0,1,0])[0],[1,1,1,1]),
        //    dot(lookAt([2,2,2],[0,0,0],[0,1,0])[1],[1,1,1,1]),
        //    dot(lookAt([2,2,2],[0,0,0],[0,1,0])[2],[1,1,1,1]));
        //console.log(
        //    dot(m[0],[-1,-1,-1,1]),
        //    dot(m[1],[-1,-1,-1,1]),
        //    dot(m[2],[-1,-1,-1,1]));

        //console.log(basicModels.cone);
        //testEntity = new EntityNode(basicModels.cone);
        //testEntity.render(testCtx);


       // console.log(basicModels.sphere, basicModels.cone);


    };

   //test();
   viewController(gl, canvas, basicModels);

}


window.onload = windowInit;

function init() {



    //document.getElementById("positonx").onchange = function (ev) {
    //    viewController.setPositionX(ev);
    //};
    //
    //document.getElementById("positonx").onchange = function (ev) {
    //    viewController.setPositionX(ev);
    //};




    //
    //document.getElementById("remove").onclick = function () {
    //        viewController.remove();
    //};
    //
    //document.getElementById("assemble").onclick = function () {
    //    viewController.assemble();
    //};
    //
    //
    //canvas.addEventListener('mousedown', function (ev) {
    //    viewController.onMouseDown(ev);
    //   // ev.preventDefault();
    //});
    //
    //canvas.oncontextmenu = function (ev) {
    //    ev.preventDefault();
    //};
    //
    //
    //canvas.addEventListener('mouseup',function (ev) {
    //    viewController.onMouseUp(ev);
    //});
    //
    //

    //
    //
    //
    //// Opera, Google Chrome and Safari
    //canvas.addEventListener("mousewheel", MouseScroll, false);
    //// Firefox
    //canvas.addEventListener("DOMMouseScroll", MouseScroll, false);
    //
    //function MouseScroll(ev) {
    //    viewController.onMouseScroll(ev);
    //    ev.preventDefault();
    //}
    //
    //
    //window.addEventListener("keydown", function (ev) {
    //    viewController.onKeyDown(ev);
    //});
    //
    //window.addEventListener("keyup", function (ev) {
    //    viewController.onKeyUp(ev);
    //});
    //
    //
    //document.getElementById("triple").onchange = function(ev) {
    //    if (ev.target.checked) {
    //        viewController.uiCtx.tripleView = true;
    //
    //    }else{
    //        viewController.uiCtx.tripleView = false;
    //
    //    }
    //    viewController.draw()
    //};
    //
    //

    // viewController.init();

}



