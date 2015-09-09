/**
 * Created by LiXi on 2015/8/11.
 */


function _Sphere() {
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 1;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];

    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);



            normalData.push(vec3(x,y,z));
            textureCoordData.push(vec2(u,v));
            vertexPositionData.push(vec3(radius * x,radius * y,radius * z));

        }
    }

    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }


    return {

        "part1":{

            vertices:{
                dimension:3,
                data:vertexPositionData
            },

            normals:{
                dimension:3,
                data:normalData
            },

            texCoord:{
                dimension:2,
                data:textureCoordData
            },

            indices:[

                {
                    description: "body",
                    glMode: "TRIANGLES",
                    data: indexData
                },

                //{
                //    description: "wireFrame",
                //    glMode: "LINE_LOOP",
                //    data: lineLoopIndices
                //},

            ]
        },
    };

}

function  _Cone () {

    var density = 120;
    var vertices1 = [];
    var vertices2 = [];
    var normals1 = [];
    var normals2 = [];

    var lineIndices1 = [];
    var lineIndices2 = [];

    var shift = 0;

    (function (){

        for (var theta = 0; theta < 360; theta +=360/density) {

            var x =  Math.cos(radians(theta)), z =  Math.sin(-radians(theta));
            var x1 =  Math.cos(radians(theta + 360/density)), z1 =  Math.sin(-radians(theta + 360/density));

            var a= vec3(shift, 2.0, shift);
            var b = vec3(x+shift, 0.0, z+shift);
            var c = vec3(x1+shift, 0.0, z1+shift);
            vertices1.push(a);
            vertices1.push(b);
            vertices1.push(c);

            normals1.push(  cross(subtract(b,a),subtract(c,a) ));
            normals1.push(  cross(subtract(c,b),subtract(a,b) ));
            normals1.push(  cross(subtract(a,c),subtract(b,c) ));


            for (var i = 0; i < density; i ++){
                lineIndices1.push(i*3);
                lineIndices1.push(i*3+1);
                lineIndices1.push(i*3+2);
            }

        }

    })();

    (function (){



        vertices2.push(vec3(shift,0,shift));
        normals2.push(vec3(0,-1,0));

        for (var theta = 0; theta >= -360; theta -=360/density) {

            var x =  Math.cos(radians(theta)), z =  Math.sin(-radians(theta));

            vertices2.push(vec3(x+shift,0,z+shift));
            normals2.push(vec3(0,-1,0));

        }


        for ( i = 1; i <= density; i ++){
            lineIndices2.push(0);
            lineIndices2.push(i);
            lineIndices2.push(i+1);
        }

    })();

    return {
        "part1":{

            vertices:{
                dimension:3,
                data:vertices1,
                glMode:"TRIANGLES"
            },

            normals:{
                dimension:3,
                data:normals1
            },

            indices:[

                {
                    description: "wireFrame",
                    glMode: "LINE_LOOP",
                    data: lineIndices1
                },

            ]
        },


        "part2":{

            vertices:{
                dimension:3,
                data:vertices2,
                glMode:"TRIANGLE_FAN"
                //glMode:"TRIANGLES"
            },

            normals:{
                dimension:3,
                data:normals2
            },

            indices:[

                {
                    description: "wireFrame",
                    glMode: "LINE_LOOP",
                    data: lineIndices2
                },

            ]
        },

    };

}

function _Triangle() {





    return {

        "part3":{

            vertices:{
                dimension:3,
                data:[vec3(-0.5,-0.5,1),vec3(0.5,-0.5,1),vec3(0,0.5,1)],
                glMode:"TRIANGLES"
            },

            normals:{
                dimension:3,
                data:[vec3(-0.5,-0.5,1),vec3(0.5,-0.5,1),vec3(0,0.5,1)],
            },

        },


    }
}

function _Square() {

    return {
        "part1":{

            vertices:{
                dimension:3,
                data:[
                    vec3(-1,1,0), vec3(-1,-1,0), vec3(1,-1,0),
                    vec3(-1,1,0), vec3(1,-1,0), vec3(1,1,0),
                ],
                glMode:"TRIANGLES"
            },

            normals:{
                dimension:3,
                data:[
                    vec3(0,0,1),vec3(0,0,1),vec3(0,0,1),
                    vec3(0,0,1),vec3(0,0,1),vec3(0,0,1),
                ],
            },

        },
    }

}

function _Cylinder() {


    var density = 72;

    var vertices = [];
    var normals1 = [];
    var normals2 = [];


    var indices1 = [];
    var indices2 = [];
    //var fanIndices3 = [];


    var lineIndices = [];

    (function (){

        vertices.push(vec3(0.0,1.0,0.0));
        normals1.push(vec3(0.0,1.0,0.0));
        normals2.push(vec3(0.0,1.0,0.0));

        for (var theta = 0; theta < 360; theta += 360/density) {

            vertices.push(
                vec3(
                    Math.cos(radians(theta)),
                    1.0,
                    Math.sin(radians(-theta))
                )
            );

            normals1.push(vec3(0.0,1.0,0.0));
            normals2.push( vec3(
                Math.cos(radians(theta)),
                0.0,
                Math.sin(radians(-theta))
            ))
        }

        for ( theta = 0; theta < 360; theta += 360/density) {

            vertices.push(
                vec3(
                    Math.cos(radians(theta)),
                    -1.0,
                    Math.sin(radians(-theta))
                )
            );

            normals1.push(vec3(0.0,-1.0,0.0));
            normals2.push( vec3(
                Math.cos(radians(theta)),
                0.0,
                Math.sin(radians(-theta))
            ))
        }

        vertices.push(vec3(0.0,-1.0,0.0));
        normals1.push(vec3(0.0,-1.0,0.0));
        normals2.push(vec3(0.0,1.0,0.0));

    })();





    (function () {
        var i,p = vertices.length-1;

        for (i = 1; i <= density-1; i ++) {
            indices1.push(0, i, i+1);
            indices1.push(p, i+density+1, i+density);
        }

        indices1.push(0,density,1);
        indices1.push(p,density+1, 2*density);



        for (i = 1; i < density; i++) {
            indices2.push(i, i+density, i+1);
            indices2.push(i+1, i+density, i+1+density);
        }

        indices2.push(i, i+density, 1);
        indices2.push(1, i+density, 1+density);



        for (i = 1 ; i <= density; i++) {
            lineIndices.push(0);
            lineIndices.push(i);

            lineIndices.push(vertices.length-1);
            lineIndices.push(vertices.length-1-i);

            lineIndices.push(i);
            lineIndices.push(i+density);

            if (i < density) {
                lineIndices.push(i);
                lineIndices.push(i+1);
                lineIndices.push(i+density);
                lineIndices.push(i+density+1);
            }

        }

        lineIndices.push(density);
        lineIndices.push(1);
        lineIndices.push(2*density);
        lineIndices.push(1+density);

    })();

    return {

        "part1":{

            vertices:{
                dimension:3,
                data:vertices,
            },

            normals:{
                dimension:3,
                data:normals1
            },

            indices:[

                {
                    description: "top_bottom",
                    glMode: "TRIANGLES",
                    data: indices1
                },

                {
                    description: "wireFrame",
                    glMode: "LINE_LOOP",
                    data: lineIndices
                }
            ]
        },


        "part2":{

            vertices:{
                dimension:3,
                data:vertices
            },

            normals:{
                dimension:3,
                data:normals2
            },

            indices:[

                {
                    description: "side",
                    glMode: "TRIANGLES",
                    data: indices2
                },

            ]
        },

    }

}

function _Disk() {

    var density = 120;
    var vertices = [];
    var lineIndices = [];

    (function (){

        vertices.push(vec3(0,0,0));
        for (var theta = 0, i = 1; theta <= 360; theta +=360/density, i++) {

            vertices.push(
                vec3( Math.cos(radians(theta + 360/density)),
                    0.0,
                    Math.sin(-radians(theta + 360/density)))
            )

            lineIndices.push(i);
        }
        lineIndices.pop();
        lineIndices.push(1);



    })();

    return {
        "part1":{

            vertices:{
                dimension:3,
                data:vertices,
               // glMode:"TRIANGLE_FAN"
                glMode:"POINTS"

            },

            indices:[

                {
                    description: "wireFrame",
                    glMode: "LINE_LOOP",
                    data: lineIndices
                },

            ]
        },

    };

}

function _Cube() {

    var vertices = [   // Vertex coordinates
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
        -1.0, -1.0, -1.0,
    ];


    var indices = [
        0, 1, 2,   0, 2, 3,    // front
        0, 3, 4,   0, 4, 5,    // right
        0, 5, 6,   0, 6, 1,    // up
        1, 6, 7,   1, 7, 2,    // left
        7, 4, 3,   7, 3, 2,    // down
        4, 7, 6,   4, 6, 5     // back
    ];


    return {
        "part1":{

            vertices:{
                dimension:3,
                data:vertices
            },

            indices:[{
                description: "body",
                glMode: "TRIANGLES",
                data: indices
            }]
        }
    }
}

function _Line() {

    var vertices = [vec3(-1,0,0), vec3(1,0,0)];
    return {
        "part1":{

            vertices:{
                dimension:3,
                data:vertices,
                glMode:"LINES",
            }

        }
    }
}

function _Grid() {


    var w = 30;
    var d = 1;
    var vertices = [];




    for (var i = 0; i  <= w/2;  i += d ) {
        vertices.push(vec3(-w/2, 0, d*i ), vec3(w/2,0,d*i));
        vertices.push(vec3(-w/2,0, -d*i ), vec3(w/2,0,-d*i));
    }

    for ( i = 0; i  <= w/2;  i += d ) {
        vertices.push(vec3(d*i, 0, -w/2 ), vec3(d*i,0,w/2));
        vertices.push(vec3(-d*i,0, -w/2), vec3(-d*i,0,w/2));
    }

    return {
        "part1":{

            vertices:{
                dimension:3,
                data:vertices,
                glMode:"LINES",
            }

        }
    }

}