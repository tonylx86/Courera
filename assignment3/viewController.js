
function group(body,axisX,axisY,axisZ) {
    return {
        body: body,
        control: {
            x: axisX,
            y: axisY,
            z: axisZ
        }
    };
}


function focus(group, on) {
    group.body.showMesh(on);
    group.control.x.display(on);
    group.control.y.display(on);
    group.control.z.display(on);
    group.control.x.showMesh(false);
    group.control.y.showMesh(false);
    group.control.z.showMesh(false);
}


function genAxis(color) {
    var shaft = new EntityNode(
        [new Cylinder(color)],
        viewController.drawCtx
    );

    var arrow = new EntityNode(
        [new Cone(color)],
        viewController.drawCtx
    );

    shaft.addChild(arrow,translate(0,1,0));
    shaft.rotate(-90,[0,0,1]);
    shaft.translate(0.0,0.5,0);
    shaft.magnify(0.04,1.5,0.04);
    arrow.magnify(4,0.15,4);
    return shaft;
}

function log(t) {
    document.getElementById("log").textContent = t;
}


function toGlPos(v) {
    var rect = canvas.getBoundingClientRect();
    return [2*(v[0] - rect.left)/canvas.width-1,
        2*(rect.bottom-(v[1]-canvas.offsetTop))/canvas.height-1];
}

function  pick(event) {
    var a = new Uint8Array(4*25);
    var rect = canvas.getBoundingClientRect();
    var tmp = null;
    var candidates = [];
    gl.readPixels(event.clientX-rect.left,
        rect.bottom-event.clientY  , 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, a);

    for (var i = 0; i < 4*25; i += 4) {
        if (a[i] > 0 ) {
            candidates.push(
                {
                    id:a[i],
                    axis:a[i+1]
                }
            );
        }
    }

    if (candidates.length > 0) {

        tmp = candidates[0];
        for (i = 1; i < candidates.length; i++) {
            if (candidates[i].id > tmp.id)
                tmp = candidates[i];

        }
    }
    return tmp;
}


var EntityNode = function (objs,initial) {

    this.objs = objs;
    this.children = [];
    this.model = mult(initial.translation || mat4() ,mult( initial.scale || mat4() ,initial.orientation || mat4()));
    this.hide = initial.hide;

    this.drawCtx = {
        gl :initial.gl,
        vColor : initial.vColor,
        vPosition : initial.vPosition,
        uMV : initial.uMV,
        showMesh: initial.showMesh
    }

};

//in euler angles
EntityNode.prototype.rotate = function (angle, axis) {

    this.model = mult(this.model,rotate(angle,axis));
};

EntityNode.prototype.translate = function (x,y,z) {

    this.model = mult(this.model,translate(x,y,z));
};

EntityNode.prototype.magnify = function (x,y,z)  {

    this.model = mult(this.model,scalem(x,y,z));
};

EntityNode.prototype.render = function (modelView, noRecur) {

    if (this.hide) return;
    var ctx= this.drawCtx;
    ctx.mv = mult(modelView||mat4(), this.model);
    this.objs.forEach(function (obj) {
        obj.render(ctx);
    });

    if (noRecur) return;

    this.children.forEach(function (e){
        if (e) e.render(ctx.mv);
    });

};


EntityNode.prototype.addChild = function (entityNode, constraint) {
    if (entityNode) {
        entityNode.model = mult(constraint||mat4(),entityNode.model);
        this.children.push(entityNode);
    }
};


EntityNode.prototype.display = function (t) {
    this.hide = !t
};

EntityNode.prototype.showMesh= function(t) {
    this.drawCtx.showMesh = t;
    this.children.forEach(function (c) {
        if (c) {
            EntityNode.prototype.showMesh.call(c,t);
        }
    })
};

var viewController = {

    camera: {
        defaultView: lookAt([10, 10, 10], [0, 0, 0], [0, 1, 0]),
        position: mat4(),
        orientation: mat4()
    },
    drawCtx: null,
    groupList: [],

    uiCtx: {
        state: 'awaiting',
        focusList: [],
        ctrlDown: false,
        lastCursorLoc: null,
        focusOn:-1,

        onAxis: null,
        onMoving: false,
        whichKey:null
    },


    init: function () {
        gl.uniformMatrix4fv(projection, false, flatten(ortho(-15, 15, -15 * 800 / 1280, 15 * 800 / 1280, 0, 100)));
        //gl.uniformMatrix4fv(projection, false, flatten(perspective(90, 1280/800, 0.1, 50)));

        this.drawCtx = {
            gl: gl,
            vColor: vColor,
            vPosition: vPosition,
            uMV: modelView
        };
        this.camera.view = this.camera.defaultView;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1.0, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

        initModels(gl);
        log("Select an object:Mouse left click | Select a group of objects: Crtl + Mouse left clicks");
        this.draw();
    },




    addObject: function (shape) {
        var body,
            axisX,
            axisY,
            axisZ,
            grp;


        function appendAxis() {
            axisX = genAxis(vec4(1, 0, 0, 1));
            axisY = genAxis(vec4(0, 1, 0, 1));
            axisZ = genAxis(vec4(0, 0, 1, 1));


            body.addChild(axisX, translate(0.5, 0, 0));
            body.addChild(axisY, mult(translate(0, 1.5, 0),
                rotate(90, [0, 0, 1])));
            body.addChild(axisZ,
                mult(translate(0, 0, 0.5), rotate(-90, [0, 1, 0])));

            body.magnify(0.5, 0.5, 0.5);
            grp = group(body, axisX, axisY, axisZ);
        }

        switch (shape) {
            case "sphere":
            {
                body = new EntityNode(
                    [new Sphere()],
                    this.drawCtx
                );
                appendAxis();

                break;
            }


            case "cone":
            {
                body = new EntityNode(
                    [new Cone(vec4(128 / 255, 128 / 255, 105 / 255, 1.0))],
                    this.drawCtx
                );

                appendAxis();
                break;
            }

            case "cylinder":
            {
                body = new EntityNode(
                    [new Cylinder(vec4(128 / 255, 128 / 255, 105 / 255, 1.0))],
                    this.drawCtx
                );
                appendAxis();
                break;
            }
        }


        (function (fls, gls) {
            fls.forEach(function (idx) {
                focus(gls[idx], false);
            });

            gls.push(grp);
            focus(grp, true);
            while (fls.length > 0) {
                fls.pop();
            }
            fls.push(gls.length - 1);

        })(this.uiCtx.focusList, this.groupList);

        this.uiCtx.focusOn = this.groupList.length-1;
        this.uiCtx.state = 'focusing';
        this.draw();
    },


    remove:function () {
        if (this.uiCtx.focusOn >= 0) {

            this.uiCtx.focusList.forEach(function (i) {
                viewController.delGroup(i)
            });

            //while(this.uiCtx.length > 0) this.uiCtx.focusList.pop();
            this.uiCtx.focusList = [];
            this.uiCtx.focusOn = -1;
            this.draw();
        }
    },

    delGroup:function(id) {
        for (var i = id ;id < this.groupList.length-1; id++){
            this.groupList[id] = this.groupList[id+1];
        }
        this.groupList.pop();
    },

    assemble: function () {

        if (this.uiCtx.focusList.length <= 1) return;
        var
            id,
            child,
            parent = this.groupList[ this.uiCtx.focusList[0]],
            ls = [];

       while(this.uiCtx.focusList.length > 1) {
           id = this.uiCtx.focusList.pop();

           focus( this.groupList[id],false);
           child = this.groupList[id].body;
           parent.body.addChild(child,inverse4(parent.body.model));
           this.groupList[id] = undefined;
       }

       for (id = 0; id < this.groupList.length; id ++) {
           if (this.groupList[id]) {
               ls.push(this.groupList[id]);
           }
       }

        this.groupList = ls;
        this.uiCtx.focusList[0] = this.groupList.indexOf(parent);
        this.uiCtx.focusOn = this.uiCtx.focusList[0];
        //focus(this.groupList[this.focusOn],true);
        focus(parent,true);
        this.draw();
    },

    onMouseDown: function (ev) {
        var
            picked = null,
            axis = null,
            id = null,
            i = null,
            grp = null;




        function clearFocus(fls, gls) {
            fls.forEach(function (idx) {
                focus(gls[idx], false);
            });
            while (fls.length > 0) fls.pop();
        }

        function drawOffline() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform1f(uOffline, 1.0);

            //draw control bars on the focus list
            for (i = 0; i < this.uiCtx.focusList.length; i++) {

                id = this.uiCtx.focusList[i];
                grp = this.groupList[id];


                gl.uniform4f(uColor, (id + 1) / 255, 250 / 255, 0, 1.0);
                grp.control.x.render(
                    mult(this.camera.view, grp.body.model)
                );

                //for y axis
                gl.uniform4f(uColor, (id + 1) / 255, 251 / 255, 0, 1.0);
                grp.control.y.render(
                    mult(this.camera.view, grp.body.model)
                );

                //for z axis
                gl.uniform4f(uColor, (id + 1) / 255, 252 / 255, 0, 1.0);
                grp.control.z.render(
                    mult(this.camera.view, grp.body.model)
                );

            }

            //draw all the bodies with out control bar
            for (id = 0; id < this.groupList.length; id++) {

                grp = this.groupList[id];
                focus(grp, false);
                gl.uniform4f(uColor, (id + 1) / 255, 0.0, 0.0, 1.0);
                grp.body.render(this.camera.view);

                for (i = 0; i < this.uiCtx.focusList.length; i++) {

                    if (this.uiCtx.focusList[i] == id) {
                        focus(grp, true);
                    }
                }
            }
        }

        switch (this.uiCtx.state) {

            case 'awaiting':
            {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.uniform1f(uOffline, 1.0);

                for (i = 0; i < this.groupList.length; i++) {
                    gl.uniform4f(uColor, (i + 1) / 255, 0.0, 0.0, 1.0);
                    this.groupList[i].body.render(this.camera.view);
                }

                picked = pick(ev);

                if (picked) {

                    id = picked.id - 1;
                    this.uiCtx.state = 'focusing';
                    /*
                     this.uiCtx.focusList.pop();
                     this.uiCtx.focusList.push(id);*/
                    this.uiCtx.focusList = [id];
                    this.uiCtx.focusOn = id;
                    focus(this.groupList[id], true);

                    log("Scroll mouse to scale in all directions \n \
                    Click an axis to adjust");
                }

                gl.uniform1f(uOffline, -1.0);
                this.draw();
                break;

            }


            case 'focusing':
            {

                drawOffline.call(viewController);
                picked = pick(ev);
                gl.uniform1f(uOffline, -1.0);


                if (!picked) {

                    this.uiCtx.state = 'awaiting';
                    clearFocus(this.uiCtx.focusList, this.groupList);
                    log("Select an object:Mouse left click | Select a group of objects: Crtl + Mouse left clicks");

                    this.uiCtx.onAxis = null;
                    this.uiCtx.onMoving = false;
                }
                else
                {

                    id = picked.id - 1;
                    axis = picked.axis;

                    for (i = 0; i < this.uiCtx.focusList.length; i++) {
                        if (this.uiCtx.focusList[i] == id) break;
                    }


                    //picked another unfocused object
                    if (i == this.uiCtx.focusList.length) {
                        if (this.uiCtx.ctrlDown) {
                            this.uiCtx.focusList.push(id);
                            this.uiCtx.focusOn = id;
                        }
                        else {
                            clearFocus(this.uiCtx.focusList, this.groupList);
                            this.uiCtx.focusList.push(id);
                            this.uiCtx.focusOn = id;
                        }

                        focus(this.groupList[id], true);
                        this.uiCtx.focusOn = id;
                        this.uiCtx.onAxis = null;
                        this.uiCtx.onMoving = false;
                        log("Select an axis: left click the target | \
                        Scale: mouse wheel");


                    }

                    else if (axis > 249 && axis <253)
                    {//picked control bar
                        this.uiCtx.onAxis =  [
                            [1,0,0,1],
                            [0,1,0,1],
                            [0,0,1,1]
                        ][axis - 250];
                        this.uiCtx.onMoving = true;
                        this.uiCtx.lastCursorLoc = toGlPos([ev.clientX, ev.clientY]);
                        this.uiCtx.whichKey = ev.which;
                        this.focusOn = id;

                        (function () {
                            var a = axis-250,t;
                            if (a == 0) t = 'X';
                            else if (a == 1) t = 'Y';
                            else t = 'Z';
                            log(
                                t + ' axis' + " is selected " + " | Move in axis direction: Drag axis with mouse left key | \
                                Scale by axis: Drag axis with mouse right key | \
                            Rotate by axis: mouse wheel"
                            );
                        })();

                    }
                    else
                    {//pick the same object

                        this.uiCtx.onAxis = null;
                        this.uiCtx.onMoving = false;
                        log("Select axis: left click the target | \
                        Scale in 3 dimentions: mouse wheel")
                    }
                }



                this.draw();
                break;
            }
        }
    },

    onMouseUp: function (ev) {
        this.uiCtx.onMoving = false;
        this.uiCtx.lastCursorLoc = null;
    },


    onMouseMove: function (ev) {
        if ((this.uiCtx.state != 'focusing') || (!this.uiCtx.onMoving)) {return;}


        var curr = toGlPos([ev.clientX,ev.clientY]);
        var last = this.uiCtx.lastCursorLoc;
        var d = normalize(subtract(curr,last));
        var body = this.groupList[this.uiCtx.focusOn].body;
        var mv = mult(this.camera.view, body.model);
        var axis = this.uiCtx.onAxis;
        var p  = normalize(subtract(
            [ dot(mv[0],axis),dot(mv[1], axis)],
            [dot(mv[0],[0,0,0,1]),dot(mv[1],[0,0,0,1])]
        ));
        var delta = dot(d,p);

        if (Math.abs(delta) > 0.5) {

            //translate
            if (this.uiCtx.whichKey == 1) {
                delta = scale(delta*0.08,axis);
                body.translate(delta[0],delta[1],delta[2]);
            }
            //scale
            else if (this.uiCtx.whichKey == 3) {
                //minimum is 1.0
                var m = add([1,1,1], scale(delta*0.02, axis.slice(0,3)));
                body.magnify(m[0],m[1],m[2]);
            }

            this.uiCtx.lastCursorLoc = curr;
        }

        viewController.draw();
    },


    onMouseScroll: function (ev) {

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

        switch  (this.uiCtx.state) {
            case "focusing":
            {
                if (this.uiCtx.onAxis) {

                    this.groupList[this.uiCtx.focusOn].body.rotate(-rolled/4,this.uiCtx.onAxis.slice(0,3));
                    this.draw();
                } else{

                    var sy =sz=sx = rolled > 0? 110/(rolled):(-rolled)/110;
                    this.groupList[this.uiCtx.focusOn].body.magnify(sx,sy,sz);
                    this.draw();
                }

                break;
            }
            default :
                break;
        }

    },


    onKeyDown: function (ev) {
        if (ev.keyCode == 17) {
            this.uiCtx.ctrlDown = true;
        }
    },


    onKeyUp: function (ev) {
        if(ev.keyCode == 17) {
            this.uiCtx.ctrlDown = false;
        }
    },

    draw: function () {

        gl.clearColor(1, 1, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        var view = this.camera.view;
        this.groupList.forEach(function (g) {
            g.body.render(view);
        })

        this.drawBackground();
    },

    drawBackground:function() {
        var x = new EntityNode([new Axis([1,0,0,1])],this.drawCtx);
        var y = new EntityNode([new Axis([0,1,0,1])],this.drawCtx);
        var z = new EntityNode([new Axis([0,0,1,1])],this.drawCtx);
        y.rotate(90,[0,0,1]);
        z.rotate(-90,[0,1,0]);
        x.render(this.camera.view);
        y.render(this.camera.view);
        z.render(this.camera.view);

        var plane = new EntityNode([new Plane()],this.drawCtx);
        plane.magnify(10,1,10);
        plane.render(this.camera.view);
    }
};

