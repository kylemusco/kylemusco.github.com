/* Custom Animations */
(function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime)) - 500;
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            },
            timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

        if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }());
  

function drawProjectSelector(id, direction) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext("2d");
    ctx.lineCap = "round";

    // variable to hold how many frames have elapsed in the animation
    var t = 1;

    // define the path to plot
    var vertices = [];

    if( direction == 'left' ) {
        vertices.push({
            x: 80,
            y: 0
        });
    } else if( direction == 'right') {
        vertices.push({
            x: 0,
            y: 0
        });
    }
    
    vertices.push({
        x: 40,
        y: 40
    });

    vertices.push({
        x: 40,
        y: 120
    });

    // set some style
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "white";
    ctx.globalCompositeOperation='source-over';
    // calculate incremental points along the path
    var points = calcWaypoints(vertices);
    // extend the line from start to finish with animation
    animate(points.reverse());

    // calc waypoints traveling along vertices
function calcWaypoints(vertices) {
    var waypoints = [];
    for (var i = 1; i < vertices.length; i++) {
        var pt0 = vertices[i - 1];
        var pt1 = vertices[i];
        var dx = pt1.x - pt0.x;
        var dy = pt1.y - pt0.y;
        var div = 2;
        if( i>1 ) {
        	div = 12;
        }
        for (var j = 0; j < div; j++) {
            var x = pt0.x + dx * j / div;
            var y = pt0.y + dy * j / div;
            waypoints.push({
                x: x,
                y: y
            });
        }
    }
    
    // Calculate circle points
    var lastWaypoint = waypoints[waypoints.length-1];
    var radius = 15;
    var interval = 1;
    for( var theta=180; theta<=545; theta += interval ) {
    	waypoints.push({
      		x: radius*Math.sin(theta*(Math.PI/180)) + lastWaypoint.x,
          y: radius*Math.cos(theta*(Math.PI/180)) + lastWaypoint.y + radius
       });

       interval += .3;
    }
    
    return (waypoints);
}


function animate() {
    if (t < points.length - 1) {
        requestAnimationFrame(animate);
    }
    // draw a line segment from the last waypoint
    // to the current waypoint
    ctx.beginPath();
    ctx.moveTo(points[t - 1].x, points[t - 1].y);
    ctx.lineTo(points[t].x, points[t].y);
    ctx.stroke();
    // increment "t" to get the next waypoint
    t++;
}
}

