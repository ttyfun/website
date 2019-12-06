var restDrag = 1;
var physics = new ParticleSystem(+0.34, -3, 0, restDrag);

var audio = document.getElementById("audio");
//定义参数
var params = {
  needsDrag: false,
  fillColor: '#fff9ee',
  strokeColor: '#000'// 0.1
};

var particles = [];
var supports = [];
var supports2 = [];
var springs = [];

var mouseDown = false;

var firstPlay = true;
var frameCount = 0;

var numPoints = 6;

var smooth = true;

var maxForce = 30;

var segmentLength = view.size.height/numPoints * 0.7;

var peaking = false;
var prevPeaking = false;

var lastPoint;

var stress = 0;

var mousePos = new Point(view.size.width/2, 0);
var targetMousePos = new Point(view.size.width/2, view.size.height-segmentLength);

var pathNeck = new Path();
pathNeck.style = {
  strokeColor: params.fillColor,
  strokeWidth: 45,
  strokeCap: 'round'
};

//先加载图片，解决ios chrome不显示图片的问题
var headNum = [0,1,2,2,2,2];
var head_color = new Image();
var head_black = new Image();
head_color.src = '../assets/head.png';
head_black.src = '../assets/head_black.png';
var head = head_color;

var headPosArray = [[3310,2640],[1980,1320],[660,0]]
var headPos = headPosArray[headNum[0]];

var stressTest = 0;

buildNeck();


function onFrame(event) {
  // console.log(this);
  frameCount++;
  updatePaths();
  physics.gravity.x = Math.sin(Date.now()/4000)*0.4;
  physics.gravity.y =  Math.sin(Date.now()/6000)*0.4 - 3
  updateAppearance(view._context);
  setPositions()
  physics.tick(1.5);
  // console.log(stress);
//!!!!!!!!!!!!!!!!!
  view.draw();
  onDraw(view._context);
};

var headPoint = new Point();

function onDraw(ctx) {
  var segment = pathNeck.segments[numPoints - 1];
  var angle = segment.angle + Math.PI/2;


  headPoint.x = segment.point.x;
  headPoint.y = segment.point.y;

  ctx.save();
  ctx.translate(headPoint.x-75, headPoint.y-180);
  // ctx.rotate(angle);
  // ctx.scale(peaking ? 1.2 : 1, peaking ? 1.2 : eyeHeight.s);

  if ( stress > 25 /* && stress < 90 */ ) {
    stress += 0.5;
    document.getElementById('shake').style.opacity = "0";
    // audio.play()

    physics.drag = 0.1;
    drawHead(ctx, head, headPos[1]);
  } else { 
      drawHead(ctx, head, headPos[0]);
      physics.drag = restDrag;

      audio.pause();
      audio.currentTime = 0;

      if (headNum[0] !=2) {
        setTimeout(function(){
          document.getElementById('shake').style.opacity = "1";
        }, 10000)
      } 
  }

  if (headNum[0] ==1) {
    document.getElementById('shake').className = "shake second-shake";
  }else if(headNum[0] ==2) {
      document.getElementById('shake').style.opacity = "0";
     setTimeout(function(){
        document.getElementById('shake').className = "last-shake";
    }, 5000)
  } 

  if ( stress > 50 ) {
    document.getElementById("cover").style.background = "";
    document.getElementById("cover").className = "fast-gradient";
  } else  {
    document.getElementById("cover").className = "slow-gradient";
  } 
  

  ctx.restore();

  ctx.save();
  ctx.translate(targetMousePos.x, window.innerHeight+30);
  // ctx.rotate(angle);
  // ctx.scale(peaking ? 1.2 : 1, peaking ? 1.2 : eyeHeight.s);
  drawBody(ctx, 120, params.fillColor);
  ctx.restore();

  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

}


function onMouseMove(event) {

  console.log(stress);
  audio.play();

  var a = Math.atan2(event.point.y - view.size.height, event.point.x - view.size.width/2);

  // console.log(a);
  targetMousePos.x = view.size.width/2 + Math.cos(a) * segmentLength*3;
  targetMousePos.y = view.size.height + Math.sin(a) * segmentLength;

}

function onResize() {
  // document.getElementById('canvas').height++;
  // document.getElementById('canvas').width++;
  segmentLength = view.size.height/numPoints * 0.7;
  particles[0].position.x = view.size.width/2;
  particles[0].position.y = view.size.height + segmentLength;
  targetMousePos.x = view.size.width/2;
  targetMousePos.y = view.size.height - segmentLength;
  for (var i = 0; i < springs.length; i++) {
    springs[i].length = segmentLength;
  }
}


function buildNeck() {

  for (i = 0; i < numPoints; i++) {

    var x = view.size.width / 2;
    var y = view.size.height - (i-1)*segmentLength;

    var particle = physics.makeParticle(2.5, x, y, 0);
    var support = physics.makeParticle(1, x, y - segmentLength, 0);
    var support2 = physics.makeParticle(1, x, y + segmentLength, 0);

    if (i > 0) {
      var prevSupport = supports[i-1];
      var prevParticle = particles[i-1];
      physics.makeSpring(particle, prevSupport, 0.6, 0.48, 0);
      physics.makeSpring(prevParticle, support2, 0.3, 0.7, 0);
      springs.push(physics.makeSpring(particle, prevParticle, 0.2, 0.1, segmentLength));
    }

    if (i < 2) {
      particle.makeFixed();
    }

    support.makeFixed();
    support2.makeFixed();

    var point = new Point();
    pathNeck.add(point);

    particles.push(particle);
    supports.push(support);
    supports2.push(support2);

  }

}


function setPositions() {


  mousePos.x += (targetMousePos.x - mousePos.x - 12);
  mousePos.y += (targetMousePos.y - mousePos.y);

  particles[1].position.x = mousePos.x;
  particles[1].position.y = mousePos.y;

  var targetStress = 0;

  for (var i = 1; i < numPoints; i++) {

    var support = supports[i];
    var curParticle = particles[i];

    var prevParticle = particles[i-1];
    var angle = Math.atan2(curParticle.position.y - prevParticle.position.y, curParticle.position.x - prevParticle.position.x);

    var force = curParticle.force.length();


    if (force > maxForce) {
      curParticle.force.scale(force / maxForce);
      
      force = maxForce;
    }

    if (i > 1) {
      targetStress += force;
    }

    support.position.x = curParticle.position.x + Math.cos(angle)*segmentLength;
    support.position.y = curParticle.position.y + Math.sin(angle)*segmentLength;

    pathNeck.segments[i].angle = angle;

    var support2 = supports2[i];
    support2.position.x = curParticle.position.x + Math.cos(Math.PI + angle)*segmentLength;
    support2.position.y = curParticle.position.y + Math.sin(Math.PI + angle)*segmentLength;

  }

  stress += (targetStress-stress)*0.03;
  // console.log(targetStress);

}

var shift = true;
function changeHead() {

  document.body.className = 'evolution';
  pathNeck.strokeColor = '#000';
  params.fillColor = "#000";
  

  // var a = 10;
  // headPos = frameCount % a-- > a/2 ? headPosArray[headNum[0]] : headPosArray[headNum[1]];

  // console.log(frameCount % a > a/2 );

  var nIntervId = setInterval(function(){
    headPos = headPosArray[headNum[0]];
    setTimeout(function(){
      headPos = headPosArray[headNum[1]];
      setTimeout(function(){
        headPos = headPosArray[headNum[0]];
      },50)
    },100)
  },150)




  document.getElementById('wish').className = "float-up";

  setTimeout(function(){
    clearInterval(nIntervId);
    stress = 0;

    //particles[0] 和 particles[1] 要一直fixed
    for (i = 2; i < numPoints; i++){
      particles[i].fixed = false;
    }
    document.getElementById("cover").style.opacity = ".5";

    if (headNum.length > 1 && headNum[0] != 2 && shift) {
      headPos = headPosArray[headNum.shift()+1];
      shift = false;
      document.body.className = '';

      setTimeout(function(){
          document.getElementById('wish').style.backgroundPositionY = -240*headNum[0] +'px';
        }, 100)
      
      setTimeout(function(){
        document.getElementById('wish').className = "";
      }, 1000)     

      params.fillColor = "#fff9ee";
      pathNeck.strokeColor = params.fillColor;
      head = head_color;
    }
  }, 1500)


}



function updateAppearance(ctx) {



  if (stress > 80 && headNum[0] !=2 ) {
    physics.drag = restDrag;
    
    pathNeck.strokeColor = '#000';
    params.fillColor = "#000";

    head = head_black;

    peaking = true;

    // fixed when updateAppearance
    for (i = 0; i < numPoints; i++){
      particles[i].fixed = true;

    }

    document.getElementById("cover").style.opacity = "0";



    // onDraw(ctx);


  } else {
    // params.fillColor = "#fff9ee";
    // pathNeck.strokeColor = params.fillColor;
    // head = head_color;
    peaking = false;
  }


  if (peaking) {
    
      changeHead();     
      if( headNum[0] == 1) {
        shift  = true;
      }

    if (!prevPeaking) {
      physics.drag = 0.2;

    }

  } else if (!peaking && prevPeaking) {
    physics.drag = restDrag;

  }

  prevPeaking = peaking;

}

// neck shacking
function updatePaths() {

  for (var i = 0, j, l; i < numPoints; i++) {

    var curParticle = particles[i];
    var prevParticle = particles[i-1];
    var angle = pathNeck.segments[i].angle + Math.PI/2;

    pathNeck.segments[i].point.x = curParticle.position.x;
    pathNeck.segments[i].point.y = curParticle.position.y;

  }

  pathNeck.smooth();
  // pathNeck.fullySelected = true;

}



function drawHead(ctx, head, headPos) {
    //var head = new Image();
    //head.src = '../assets/head.png';
    ctx.drawImage(head, 0,headPos, 450, 660, 0,0, 150,220 );
}

function drawBody(ctx, radius, style) {
  ctx.beginPath();
  ctx.arc(0, 0, radius,  0, Math.PI*2, true);
  ctx.fillStyle = style;
  ctx.fill();
}


/****** mobile shake  *****/

shakeMobile();

function shakeMobile() {
  if ((window.DeviceMotionEvent) || ('listenForDeviceMovement' in window)) {
    window.addEventListener('devicemotion', deviceMotionHandler, false);
  } 
}

function deviceMotionHandler(eventData) {

  var acceleration = eventData.acceleration;
  var a = -1.5 + acceleration.x/120;
  
  targetMousePos.x = view.size.width/2 + Math.cos(a) * segmentLength*3;
  targetMousePos.y = view.size.height + Math.sin(a) * segmentLength;

  audio.play()

}

/**** end mobile shake ******/
setTimeout(function(){
  document.getElementById('shake').className = "shake";
}, 3000)
