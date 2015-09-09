/**
 * Created by LiXi on 2015/8/12.
 */

"use strict";

var EntityNode = function (model) {

    this.model = model;
    this.components = [];


    //this.position = vec3(); //mult(initial.translation || mat4() ,mult( initial.scale || mat4() ,initial.orientation || mat4()));
   // this.orientation = mat3(); //object frame to inertial frame

    this.scaleMatrix = mat4();
    this.modelMatrix = mat4();
   // this.viewMatrix = mat4();
    this.rotation = vec3(0.0,0.0,0.0); // euler angels
    this.hide = false;
    this.wireFrame  = false;

};

// in object frame
EntityNode.prototype.rotate = function (angle, axis) {
    this.modelMatrix = mult(this.modelMatrix,rotate(angle,axis));
   // this.rotation = rotationMatrixToEulerAngles(this.orientation);
   // this.updateModelMatrix();
};

EntityNode.prototype.rotateWorld = function (angle, axis) {
    this.modelMatrix = mult(rotate(angle,axis),this.modelMatrix);
    // this.rotation = rotationMatrixToEulerAngles(this.orientation);
    // this.updateModelMatrix();
};

EntityNode.prototype.getRotation = function () {
    var m = this.modelMatrix;
    var orientation = mat3(
        m[0][0],m[0][1],m[0][2],
        m[1][0],m[1][1],m[1][2],
        m[2][0],m[2][1],m[2][2]);
    return  rotationMatrixToEulerAngles(orientation);
};

EntityNode.prototype.getOrientation =function () {

    return this.modelMatrix;
}


EntityNode.prototype.setOrientation =function (m) {

    this.modelMatrix = m;
}

EntityNode.prototype.setRotation = function (head,attitude,bank) {
    var position = this.getPosition();
    var m = mat4();
    m[0][3] = position[0];
    m[1][3] = position[1];
    m[2][3] = position[2];

    var orientation = mult(rotate(head, [0,1,0]),
        mult(rotate(attitude,[0,0,1]),rotate(bank,[1,0,0])));
    this.modelMatrix = mult(m,orientation);

    //this.updateModelMatrix();
};

//in object frame
EntityNode.prototype.translate = function (x,y,z) {

    this.modelMatrix = mult(this.modelMatrix,translate(x,y,z));

   // this.updateModelMatrix();
};


EntityNode.prototype.translateWorld = function (x,y,z) {

    this.modelMatrix = mult(translate(x,y,z),this.modelMatrix);

    // this.updateModelMatrix();
};

EntityNode.prototype.setPosition = function (x,y,z) {

    this.modelMatrix[0][3] = x;
    this.modelMatrix[1][3] = y;
    this.modelMatrix[2][3] = z;
   // this.updateModelMatrix();
};

EntityNode.prototype.getPosition = function ()  {
    return vec3(
        this.modelMatrix[0][3],
        this.modelMatrix[1][3],
        this.modelMatrix[2][3]);
};

EntityNode.prototype.scale = function (x,y,z)  {
    this.scaleMatrix = mult(this.scaleMatrix, scalem(x,y,z));
   // this.updateModelMatrix()
};

EntityNode.prototype.setScale = function (x,y,z)  {
    this.scaleMatrix = scalem(x,y,z);
   // this.updateModelMatrix();
};

EntityNode.prototype.getScale = function ()  {
    return vec3(
        this.scaleMatrix[0][0],
        this.scaleMatrix[1][1],
        this.scaleMatrix[2][2])
};

//EntityNode.prototype.updateModelMatrix = function ()  {
//   // this.modelMatrix = mult(this.position, mult(this.orientation,this.scaleMatrix));
//    console.log(this.modelMatrix[0]);
//    console.log(this.modelMatrix[1]);
//    console.log(this.modelMatrix[2]);
//    console.log(this.modelMatrix[3]);
//
//};


EntityNode.prototype.setMaterials = function (materials) {
    //this.materials = {
    //    materialAmbient : vec4( 1.0, 0.0, 1.0, 1.0 ),
    //    materialDiffuse : vec4( 1, 0.8, 0.0, 1.0),
    //    materialSpecular : vec4( 1, 1, 1, 1.0 ),
    //    materialShininess : 20.0
    //};

}

EntityNode.prototype.setColor = function (color,noRecur) {
    this.color =color;
    if (noRecur) return;

    this.components.forEach(function (e) {
        e.setColor(color);
    })
}

EntityNode.prototype.unsetColor = function (noRecur) {

    this.color = undefined;

    if (noRecur) return;
    this.components.forEach(function (e) {
        e.unsetColor();
    })
}


EntityNode.prototype.render = function (ctx, noRecur) {

    if (this.hide) return;

    if (!ctx) {
        throw("EntityNode.prototype.render: no ctx input!");
    }
    var gl = ctx.gl;
    //var viewMatrix = ctx.viewMatrix || mat4();
    var modelMatrixLoc = ctx.modelMatrixLoc;
    var normalMatrixLoc = ctx.normalMatrixLoc ;
    var pushDownMatrix = ctx.pushDownMatrix;



    var finalModelMatrix = mult(this.modelMatrix,this.scaleMatrix);

    if (pushDownMatrix) {
        finalModelMatrix = mult(pushDownMatrix, finalModelMatrix);
    }
     gl.uniformMatrix4fv(modelMatrixLoc,false,flatten(finalModelMatrix));


    if (normalMatrixLoc) {

        var m = finalModelMatrix;
         m = mat3(
            m[0][0],m[0][1],m[0][2],
            m[1][0],m[1][1],m[1][2],
            m[2][0],m[2][1],m[2][2]
        )

        var normalMatrix =transpose(inverse(m));
        //console.log(dot(normalMatrix[0],[-1,-1,-1]),
        //    dot(normalMatrix[1],[-1,-1,-1]),
        //    dot(normalMatrix[2],[-1,-1,-1]));

        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    }


    if (this.color) {

        gl.uniform1f(ctx.uFlagMonoColor, 1.0);
        gl.uniform4fv(ctx.uColor, flatten(this.color));
    }


    if (this.model) {

        if (this.wireFrame)
            this.model.render({wireFrame:true});
        else
            this.model.render();
    }


    if (noRecur) return;

    if (this.components.length > 0) {

        var savedPushDownMatrix = pushDownMatrix;
        ctx.pushDownMatrix  = finalModelMatrix;
        this.components.forEach(function (e) {
            e.render(ctx);
        });

        ctx.pushDownMatrix = savedPushDownMatrix;
    }



    if (this.color) {
        gl.uniform1f(ctx.uFlagMonoColor, -1.0);
    }

};



EntityNode.prototype.addComponent = function (entityNode, displacement) {
    //if (entityNode.prototype !== EntityNode.prototype) {
    //    throw ("addComponent: not an EntityNode");
    //}

    //only works if component not move itself
    entityNode.modelMatrix = mult(displacement || mat4(), entityNode.modelMatrix );
    this.components.push(entityNode);

}

EntityNode.prototype.deleteComponent = function (entityNode) {
    for (var i = 0; i < this.components.length; i++) {
        if (this.components[i] === entityNode) {
            break;
        }
    }

    this.components = this.components.slice(0,i).concat(
        this.components.slice(i+1, this.components.length));

    // place the component back to the world frame
    //entityNode.modelMatrix = mult(this.modelMatrix);

}

EntityNode.prototype.display = function (t, noRecur) {
    this.hide = !t;
    if (noRecur) return;
    this.components.forEach(function (c) {
        if (c) {
            c.display(t);
        }
    })
};

EntityNode.prototype.drawWireFrame = function(t, noRecur) {

    this.wireFrame = t;
    if (noRecur) return;
    this.components.forEach(function (c) {
        if (c) {
            c.drawWireFrame(t);
        }
    })
};




function rotationMatrixToEulerAngles(m) {
    /** this conversion uses conventions as described on page:
     *   http://www.euclideanspace.com/maths/geometry/rotations/euler/index.htm
     *   Coordinate System: right hand
     *   Positive angle: right hand
     *   Order of euler angles: heading first, then attitude, then bank
     *   matrix row column ordering:
     *   [m00 m01 m02]
     *   [m10 m11 m12]
     *   [m20 m21 m22]
     *   input: Matrix of object frame to inertial frame
     *
     *   */

        // Assuming the angles are in radians.


        var heading,bank,attitude; //
        if (m[1][0] > 0.998) { // singularity at north pole
            heading = Math.atan2(m[0][2],m[2][2]);
            attitude = Math.PI/2;
            bank = 0;
            //return;
        }
        else if (m[1][0] < -0.998) { // singularity at south pole
            heading = Math.atan2(m[0][2],m[2][2]);
            attitude = -Math.PI/2;
            bank = 0;
            //return;
        }

        else{
            heading = 180.0/Math.PI * Math.atan2(-m[2][0],m[0][0]);
            bank = 180.0/Math.PI * Math.atan2(-m[1][2],m[1][1]);
            attitude = 180.0/Math.PI * Math.asin(m[1][0]);
        }
    return vec3(heading,attitude,bank);

}

function packFloatToRGBA(f) {


    function frac(v) {

        function _frac(t) {
            return t-Math.floor(t);
        }
        return vec4(_frac(v[0]), _frac(v[1]), _frac(v[2]),_frac(v[3]));
    }


    var shift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 *256.0 * 256.0);
    var mask = vec4(1.0/256, 1.0/256, 1.0/256,0.0);

    var ret =   frac(scale(f,shift));

    return subtract(ret,  mult(mask,  vec4(ret[1],ret[2],ret[3], ret[3])  )  );

}
function unPackRGBAtoFloat(v) {

    return v[0]+v[1]/256.0+v[2]/65536.0+v[3]/(Math.pow(256.0, 3));
}