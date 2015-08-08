/**
 * Created by LiXi on 2015/8/3.
 */
var lineColor = vec4(1,1,1,1);
var _Sphere = {
    init:
        function (gl) {

            this.gl = gl;
            var density = 18;
            var vertices = [];
            var colors = [];
            var lineColors = [];

            (function ()  {
                vertices.push(vec3(0.0,1.0,0.0));
                colors.push(vec4(128/255,128/255,105/255,1.0));
                lineColors.push(lineColor);
                for (var theta = 180/density; theta <= 180-180/density; theta += 180/density) {
                    for (var phi = 0; phi < 360; phi += 360/density) {
                        vertices.push(vec3(
                            Math.sin(radians(theta))*Math.cos(radians(phi)),
                            Math.cos(radians(theta)),
                            Math.sin(radians(theta))*Math.sin(radians(phi))));

                        colors.push(vec4(128/255,128/255,105/255,1.0));
                        lineColors.push(lineColor);
                    }
                }

                vertices.push(vec3(0.0,-1.0,0.0));
                colors.push(vec4(128/255,128/255,105/255,1.0));
                lineColors.push(lineColor);
            })();

            this.fanIndices = [];
            this.stripeIndices =[];
            this.lineLoopIndices = [];

            (function (f,s,lp) {

                //triangle fan
                for (var i = 0; i < density +1; i++) {
                    f[i] = i;
                }
                f.push(1);

                //triangle stripe
                for (i = 1; i < vertices.length-(density+1); i += density) {
                    for (var j = 0; j < density; j++) {
                        s.push(i+j);
                        s.push(i+j+density);
                    }
                    s.push(i);
                    s.push(i+density);
                }


                //line loop
                for (i = 1; i <= density/2; i ++){
                    lp.push(0);
                    for (j =i; j  < vertices.length-1; j += density  ) {
                        lp.push(j);
                    }

                    lp.push(vertices.length-1);
                    for(j = j-density+density/2; j > 0; j -= density){
                        lp.push(j);
                    }
                    lp.push(0);
                }

                for (i = 1; i < vertices.length-1; i += density) {
                    for (j = 0; j < density; j++) {
                        lp.push(i+j);
                    }
                    lp.push(i);
                }
                for (i = i- 2*density; i > 0 ; i -= density) {
                    lp.push(i);
                }
                lp.push(0);


            })(this.fanIndices,this.stripeIndices,this.lineLoopIndices);

            this.pts = vertices.length;

            this.vBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
            gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices),gl.STATIC_DRAW);

            this.cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER,flatten(colors),gl.STATIC_DRAW);


            this.cBuffer2 = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer2);
            gl.bufferData(gl.ARRAY_BUFFER,flatten(lineColors),gl.STATIC_DRAW);

            this.fanIbuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices),gl.STATIC_DRAW);

            this.stripeIbuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.stripeIbuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.stripeIndices),gl.STATIC_DRAW);

            this.lineLoopBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineLoopBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.lineLoopIndices),gl.STATIC_DRAW);

            return this;
        },
    render:
        function (ctx) {
            /*
             ctx {vColor, vPosition, mv, uMV }
             */
            var
                gl = this.gl,
                vColor = ctx.vColor,
                vPosition = ctx.vPos,
                mv = ctx.mv,
                uMV = ctx.uMV,
                showMesh = ctx.showMesh;

            gl.uniformMatrix4fv(uMV,false,flatten(mv));


            gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            //gl.uniform4fv(vColor,flatten([0.0,1.0,0.0,1.0]));
            if (showMesh) {
                gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer2);
                gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
                gl.enableVertexAttribArray( vColor );
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineLoopBuffer);
                gl.drawElements( gl.LINE_LOOP, this.lineLoopIndices.length, gl.UNSIGNED_SHORT, 0 );
            }





            gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer);
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.stripeIbuffer);
            gl.drawElements( gl.TRIANGLE_STRIP, this.stripeIndices.length, gl.UNSIGNED_SHORT, 0 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer);
            gl.drawElements( gl.TRIANGLE_FAN,  this.fanIndices.length, gl.UNSIGNED_SHORT, 0 );
            gl.uniformMatrix4fv(uMV,false,flatten( mult(mv,scalem(1.0,-1.0,1.0))));
            gl.drawElements( gl.TRIANGLE_FAN, this.fanIndices.length, gl.UNSIGNED_SHORT, 0 );
        }


};

var Sphere = function () {

};
Sphere.prototype = Object.create(_Sphere);
Sphere.prototype.constructor = Sphere;

var _Axis = {
    init:function(gl) {
        this.gl = gl;
        var vertices = [
            vec3(1,0,0),
            vec3(0, 0,0),
        ];
        var colors = [
            vec4(1.0,0.0,0.0,1.0),
            vec4(1.0,0.0,0.0,1.0),
        ];

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices),gl.STATIC_DRAW);


        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(colors),gl.STATIC_DRAW);

        this.pts = vertices.length;
        return this;
    },

    render: function (ctx) {
        var
            gl = this.gl,
            vColor = ctx.vColor,
            vPosition = ctx.vPos,
            mv = ctx.mv,
            uMV = ctx.uMV;

        gl.uniformMatrix4fv(uMV,false,flatten(mv));

        gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer);
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.drawArrays(gl.LINES, 0, this.pts);
    }
};


var Axis = function (color) {
    if (color) {


        var colors = [color,color];
        this.render =  function (ctx) {
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
            _Axis.render(ctx);
        }

    }
    else {alert('no color for axis!');}
};
Axis.prototype = Object.create(_Axis);
Axis.prototype.constructor = Axis;


var _Cone = {
    init: function (gl) {
        this.gl  = gl;
        var density = 20;
        var vertices = [];
        var colors = [];
        var lineColors = [];
        var color1 = vec4(128/255,128/255,105/255,1.0);
        var color2 = lineColor;

        (function (){
            vertices.push(vec3(0.0,3.0,0.0));
            colors.push(color1);
            lineColors.push(color2);
            for (var theta = 180; theta > -180; theta -= 360/density) {

                vertices.push(
                    vec3(
                        Math.cos(radians(theta)),
                        0.0,
                        Math.sin(radians(theta))
                    )
                );
                colors.push(color1);
                lineColors.push(color2);
            }

            vertices.push(vec3(0.0,0.0,0.0));
            colors.push(color1);
            lineColors.push(color2);

        })();


        this.fanIndices1 = [];
        this.fanIndices2 = [];
        this.lineIndices = [];

        (function (f1,f2,ld) {
            for(var i = 0; i < vertices.length-1;i++) {
                f1.push(i);
            }
            f1.push(1);


            f2.push(vertices.length-1);
            for( i = 1; i < vertices.length-1;i++) {
                f2.push(i);
            }
            f2.push(1);


            for (i = 1 ; i < vertices.length-1; i++) {
                ld.push(0);
                ld.push(i);
                ld.push(vertices.length-1);
                ld.push(i);
            }

            for (i = 1 ; i < vertices.length-2; i++) {
                ld.push(i);
                ld.push(i+1);
            }
            ld.push(1);
            ld.push(vertices.length-2);


        })(this.fanIndices1,this.fanIndices2,this.lineIndices);

        this.pts = vertices.length;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices),gl.STATIC_DRAW);

        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(colors),gl.STATIC_DRAW);

        this.cBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(lineColors),gl.STATIC_DRAW);

        this.fanIbuffer1 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer1);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices1),gl.STATIC_DRAW);

        this.fanIbuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer2);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices2),gl.STATIC_DRAW);

        this.lineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.lineIndices),gl.STATIC_DRAW);

        return this;

    },

    render:
        function(ctx) {
            var
                gl = this.gl,
                vColor = ctx.vColor,
                vPosition = ctx.vPos,
                mv = ctx.mv,
                uMV = ctx.uMV,
                showMesh = ctx.showMesh;

            gl.uniformMatrix4fv(uMV,false,flatten(mv));


            gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );





            gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer);
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer2);
            gl.drawElements( gl.TRIANGLE_FAN, this.fanIndices2.length, gl.UNSIGNED_SHORT, 0 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer1);
            gl.drawElements( gl.TRIANGLE_FAN, this.fanIndices1.length, gl.UNSIGNED_SHORT, 0 );



            if (showMesh) {
                gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer2);
                gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
                gl.enableVertexAttribArray( vColor );
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineBuffer);
                gl.drawElements( gl.LINES, this.lineIndices.length, gl.UNSIGNED_SHORT, 0 );
            }

        }

};

var Cone = function (color) {

    if (color) {

        var colors = [];
        for (var i = 0; i < this.pts; i++) {
            colors.push(color);
        }
        this.render =  function (ctx) {
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
            _Cone.render(ctx);
        }

    }
    //else {alert('no color for axis!');}

};

Cone.prototype = Object.create(_Cone);
Cone.prototype.constructor = Cone;



var _Cylinder =  {

    init: function (gl) {
        this.gl  = gl;
        var density = 30;
        var vertices = [];
        var colors = [];
        var lineColors = [];
        var color1 = vec4(128/255,128/255,105/255,1.0);
        var color2 = lineColor;


        (function (){
            vertices.push(vec3(0.0,1.0,0.0));
            colors.push(color1);
            lineColors.push(color2);
            for (var theta = 0; theta < 360; theta += 360/density) {

                vertices.push(
                    vec3(
                        Math.cos(radians(theta)),
                        1.0,
                        Math.sin(radians(theta))
                    )
                );
                colors.push(color1);
                lineColors.push(color2);
            }

            for ( theta = 0; theta < 360; theta += 360/density) {

                vertices.push(
                    vec3(
                        Math.cos(radians(theta)),
                        -1.0,
                        Math.sin(radians(theta))
                    )
                );
                colors.push(color1);
                lineColors.push(color2);
            }

            vertices.push(vec3(0.0,-1.0,0.0));
            colors.push(color1);
            lineColors.push(color2);

        })();


        this.fanIndices1 = [];
        this.fanIndices2 = [];
        this.fanIndices3 = [];
        this.lineIndices = [];


        (function (f1,f2,f3,ld) {
            for(var i = 0; i <= density; i++) {
                f1.push(i);
            }
            f1.push(1);


            for( i = 1; i <= density+1; i++) {
                f2.push(vertices.length-i);
            }
            f2.push(vertices.length-2);


            for (i = 1; i <= density; i++) {
                f3.push(i);
                f3.push(i+density);
            }
            f3.push(1);
            f3.push(1+density);



            for (i = 1 ; i <= density; i++) {
                ld.push(0);
                ld.push(i);

                ld.push(vertices.length-1);
                ld.push(vertices.length-1-i);

                ld.push(i);
                ld.push(i+density);

               if (i < density) {
                   ld.push(i);
                   ld.push(i+1);
                   ld.push(i+density);
                   ld.push(i+density+1);
               }

            }

            ld.push(density);
            ld.push(1);
            ld.push(2*density);
            ld.push(1+density);


        })(this.fanIndices1,this.fanIndices2,this.fanIndices3,this.lineIndices);

        this.pts = vertices.length;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices),gl.STATIC_DRAW);

        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(colors),gl.STATIC_DRAW);

        this.cBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(lineColors),gl.STATIC_DRAW);


        this.fanIbuffer1 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer1);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices1),gl.STATIC_DRAW);

        this.fanIbuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer2);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices2),gl.STATIC_DRAW);

        this.fanIbuffer3 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer3);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.fanIndices3),gl.STATIC_DRAW);

        this.lineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.lineIndices),gl.STATIC_DRAW);

        return this;

    },

    render:
        function(ctx) {
            var
                gl = this.gl,
                vColor = ctx.vColor,
                vPosition = ctx.vPos,
                mv = ctx.mv,
                uMV = ctx.uMV,
                showMesh = ctx.showMesh;

            gl.uniformMatrix4fv(uMV,false,flatten(mv));


            gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );





            gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer);
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer2);
            gl.drawElements( gl.TRIANGLE_FAN, this.fanIndices2.length, gl.UNSIGNED_SHORT, 0 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer1);
            gl.drawElements( gl.TRIANGLE_FAN, this.fanIndices1.length, gl.UNSIGNED_SHORT, 0 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fanIbuffer3);
            gl.drawElements( gl.TRIANGLE_STRIP, this.fanIndices3.length, gl.UNSIGNED_SHORT, 0 );



            if (showMesh) {
                gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer2);
                gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
                gl.enableVertexAttribArray( vColor );
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.lineBuffer);
                gl.drawElements( gl.LINES, this.lineIndices.length, gl.UNSIGNED_SHORT, 0 );
            }

        }

}


var Cylinder = function (color) {

    if (color) {

        var colors = [];
        for (var i = 0; i < this.pts; i++) {
            colors.push(color);
        }
        this.render =  function (ctx) {
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
            _Cylinder.render(ctx);
        }

    }
    //else {alert('no color for axis!');}

};

Cylinder.prototype = Object.create(_Cylinder);
Cylinder.prototype.constructor = Cylinder;





var _Plane = {
    init:function(gl) {
        this.gl = gl;
        var vertices = [
            vec3(0,0,0),
            vec3(-1,0,1),
            vec3(0,0,1),
            vec3(1,0,1),
            vec3(1,0,0),
            vec3(1,0,-1),
            vec3(0,0,-1),
            vec3(-1,0,-1),
            vec3(-1,0,0),
            vec3(-1,0,1),

        ];
        //var color = vec4(1,228/255,225/255,0.5);
        var color =vec4(0,0.5,1,0.8);

        var colors = [
            color,
            color,
            color,
            color,
            color,
            color,
            color,
            color,
            color,
            color
        ];

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices),gl.STATIC_DRAW);


        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,flatten(colors),gl.STATIC_DRAW);

        this.pts = vertices.length;
        return this;
    },

    render: function (ctx) {
        var
            gl = this.gl,
            vColor = ctx.vColor,
            vPosition = ctx.vPos,
            mv = ctx.mv,
            uMV = ctx.uMV;

        gl.uniformMatrix4fv(uMV,false,flatten(mv));

        gl.bindBuffer( gl.ARRAY_BUFFER,this.cBuffer);
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.bindBuffer( gl.ARRAY_BUFFER,this.vBuffer);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.pts);
    }
}
var Plane = function (color) {
    if (color) {

        var colors = [];
        for (var i = 0; i < this.pts; i++) {
            colors.push(color);
        }
        this.render =  function (ctx) {
            gl.bindBuffer(gl.ARRAY_BUFFER,this.cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
            _Plane.render(ctx);
        }

    }
};

Plane.prototype = Object.create(_Plane);
Plane.prototype.constructor = Plane;


function initModels(gl) {
    _Sphere.init(gl);
    _Axis.init(gl);
    _Cone.init(gl);
    _Cylinder.init(gl);
    _Plane.init(gl);
}