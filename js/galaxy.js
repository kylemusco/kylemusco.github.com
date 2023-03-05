/* This was built off of Astrak's galaxy project: https://codepen.io/Astrak/ */


var t=0,z=0;
var howMuch=0,times=0,val=0;

setScene();
animate();

function newGalaxy (_n, _axis1, _axis2, _armsAngle, _bulbSize, _ellipticity){
  
  //number of particles.
  var n=(typeof _n === 'undefined')?1000000:_n;

  // Less particles for mobile devices
  if( /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ) {
    n = 600000;
  }

  // Hard coded for consistency
  var axis1 = 96.43237102686038;
  var axis2 = 164.5323350334049;

  //make sure axis1 is the biggest (excentricity equation fails if they are inverted), and allow the coder no to care about axis order
  var maja,mina;
  axis1>axis2?(maja=axis1,mina=axis2):
    axis1==axis2?(maja=axis1+1,mina=axis2):(maja=axis2,mina=axis1);

  var bulbSize = 0.11835327566655209;
  var ellipticity = 0.22489109300655017;
  var armsAngle = 15;

  var stars=[];

  for(var i=0;i<n;i++){

    var dist=Math.random();
    var angle=(dist-bulbSize)*armsAngle;

    //ellipse parameters
    var a=maja*dist;
    var b=mina*dist;
    var e=Math.sqrt(a*a-b*b)/a;
    var phi=ellipticity*Math.PI/2*(1-dist)*(Math.random()*2-1);

    //create point on the ellipse with polar coordinates
    //1. random angle from the center
    var theta=Math.random()*Math.PI*2;
    //2. deduce radius from theta in polar coordinates, from the CENTER of an ellipse, plus variations
    var radius=Math.sqrt(b*b/(1-e*e*Math.pow(Math.cos(theta),2)))*(1+Math.random()*.1);
    //3. then shift theta with the angle offset to get arms, outside the bulb
    if(dist>bulbSize)theta+=angle;
    
    //convert to cartesian coordinates
    stars.push({
      x:Math.cos(phi)*Math.cos(theta)*radius,
      y:Math.cos(phi)*Math.sin(theta)*radius,
      z:Math.sin(phi)*radius/2
    });
  }

  return stars;
}

//threejs functions
var cube;
function setScene(){
  scene=new THREE.Scene();
  
  var geometry = new THREE.BoxGeometry(15,15,15);
  var material = new THREE.MeshBasicMaterial({color:0x00ff20});
  cube = new THREE.Mesh(geometry, material);
  //scene.add(cube);

  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.5,1500);

	camera.position.set(-100,-100,80);
  camera.lookAt(new THREE.Vector3(0,0,0));
  camera.rotation.z -= .7;

  renderTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight);

  renderer=new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(innerWidth,innerHeight);
  
  renderer.setClearColor(0x0000000, 0);
  $('#galaxy').append(renderer.domElement);
  setGalaxy();
}

var globalstars;
function setGalaxy(){
  galaxyMaterial=new THREE.ShaderMaterial({
      vertexShader:document.getElementById('vShader').textContent,
      fragmentShader:document.getElementById('fShader').textContent,
      uniforms:{
        size:{type:'f',value:0.3},
        t:{type:"f",value:0.15},
        z:{type:"f",value:0.15},
        pixelRatio:{type:"f",value:innerHeight}
      },
      transparent:true,
      depthTest:false,
      blending:THREE.AdditiveBlending
    });
  var stars1=new THREE.Geometry();
  stars1.vertices=newGalaxy();
  globalstars = stars1.vertices;
  galaxy=new THREE.Points(stars1,galaxyMaterial);
  scene.add(galaxy);
}

function animate(){
  galaxyMaterial.uniforms.z.value=z;
  requestAnimationFrame(animate);
  renderer.render(scene,camera);

  // Pause rotation on mobile devices
  if( !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ) {
    scene.rotation.z-=.000002;
  }
  
}

// Hiding variables - Used for preventing multiple calls
var hidingGalaxy = false;
var hidingProjects = false;
var hidingSideNav = false;
var hidingTitle = false;
function cameraZoom(x,y,project) {
    // Get destination and camera coordinates as vectors
    var destinationVector = new THREE.Vector3(x,y,0);
    var cameraVector = new THREE.Vector3(-100,-100,80);

    // Find direction from camera to destination
    var direction = new THREE.Vector3();
    direction.subVectors( destinationVector, cameraVector );

    // Sloowwwwwwww
    var speed = .0000001;

    var vector = direction.multiplyScalar(speed,speed,0);

    var inc = 0;
    // Create interval to animate position change
    var zoomIn = setInterval( function() {
      
      // Increase speed exponentially with each iteration
      for( var i=0; i<inc*inc; i++ ) {
        camera.position.x += vector.x;
        camera.position.y += vector.y;
        camera.position.z += vector.z;
      }
      inc++;

      // Adjust camera rotation
      if( camera.rotation.z > -1 ) {
          camera.rotation.z -= .00075;
      }

      // Hide galaxy
      if( camera.position.z < 35 && !hidingGalaxy ) {
        hidingGalaxy = true;
        $('#galaxy').fadeOut('slow');

        hidingTitle = true;

        $('.title').fadeOut('slow');
        //$('body').append('<div class="stuff">DESCRIPTION</div>');

        // Display project details
        displayProjectDetails(project);
      }

      // Hide projects
      if( camera.position.z < 80 && !hidingProjects) {
        hidingProjects = true;
        $('#experience-content').fadeOut('slow');
      }

      // Hide Sidenavs
      if( camera.position.z < 79.75 && !hidingSideNav ) {
        hidingSideNav = true;

        // Hide left nav
        $('.left-nav').animate({
          left: '-50%'
        }, 2000 );

        // Hide right nav
        $('#nav-container').animate({
          left: '500%'
        }, 4000 );
      }

      // Stop at destination
      if( camera.position.z < 10 ) {
        clearInterval(zoomIn);
      }
    }, 10 );
}

function cameraReset() {
  // Reset position
  camera.position.x = -100;
  camera.position.y = -100;
  camera.position.z = 80;

  // Reset rotation
  camera.rotation.z = -0.04424713426756932;

  // Show hidden elements
  $('#galaxy').show();
  $('#experience-content').show();
  $('.left-nav').css('left', '0');
  $('#nav-container').css('left',0);
  $('.title').show();

  // Reset hiding variables
  hidingGalaxy = false;
  hidingProjects = false;
  hidingSideNav = false;
  hidingTitle = false;
}

/* Used to find coordinates of project markers */
function moveBox() {
  cube.translateX( $('#x').val() );
  cube.translateY( $('#y').val() );

  console.log("X: " + cube.position.x + " Y: " + cube.position.y );
}

var selectedNavItem;
var selectedProject;
function displayProjectDetails(project) {
    selectedProject = project;
    
    // Add projects container
    $('body').append("<div id='project-desc-container' class='project-desc-container'></div>");
    
    // Add back button
    $('#project-desc-container').append("<div class='back-btn'><img class='back-btn-icon' src='images/back.png'>back</div>");

    // Add nav bar
    $('#project-desc-container').append("<div class='left-nav-container'><div id='project-nav-container' class='left-nav-container-inner'></div></div>");

    // Append nav items
    Object.keys(projects[project]).forEach( function(key,i) {
      
      // If key has sub items, add div
      if( projects[project][key].content == undefined ) {
          // Append key 
          $('#project-nav-container').append('<div class="left-nav-item" id="' + key.replaceAll(" ", "_" ) + '">' + key + '</div><div id="' + key.replaceAll(" ", "_" ) + '-subitems" class="left-nav-subitems"></div>');

          // Append subkeys
          Object.keys(projects[project][key]).forEach( function(subkey) {
              $('#' + key.replaceAll(" ", "_" ) + '-subitems').append('<div class="left-nav-subitem" id="' + subkey.replaceAll(" ", "_" ) + '">' + subkey + '</div>');
          });
      } else {
          $('#project-nav-container').append('<div class="left-nav-item" id="' + key.replaceAll(" ", "_" ) + '">' + key + '</div>');
      }
    });

    // Set first key as 'selected'
    selectedNavItem = $('#' + Object.keys(projects[project])[0] );
    selectedNavItem.addClass("subitem-selected");

    // Fade in containing div
    $('#project-desc-container').delay(500).fadeIn('slow');

    // Display content
    displayProjectContent(Object.keys(projects[project])[0]);    
}

/* Display subitems on hover */
var subnavOpen = false;
$(document).on('mouseover', '.left-nav-item', function() {
    
    var id = $(this).attr('id');
    var subitems = $('#' + id + '-subitems');

    subnavOpen = true;
    resetNavbar();

    // If item has subitems, show them
    if( subitems.hasClass("left-nav-subitems") ) {

      // Count subitems
      var subitemCount = 0;
      subitems.find('.left-nav-subitem').each( function() {
        subitemCount++;
      });

      // Change height of main nav
      $(this).height(30);

      // Set item as selected
      $(this).addClass('subitem-selected');

      // Change height of subnav container

      subitems.height( subitemCount*30 );
    }
});

/* Hide subitems on hover out */
$(document).on('mouseout', '.left-nav-item', function() {
    var id = $(this).attr('id');
    var subitems = $('#' + id + '-subitems');

    // If item has subitems, hide them
    if( subitems.hasClass("left-nav-subitems") ) {

      if( !subnavOpen ) {
        // Change height
        $(this).height(50);

        subitems.height(0);
      }
    }
});

/* Handle project nav item click */
$(document).on('click', '.left-nav-item', function() {
  // Remove selected class from previously selected 
  $('.left-nav-item').removeClass("subitem-selected");
  $('.left-nav-subitem').removeClass("subitem-selected");

  $(this).addClass("subitem-selected");

  // Display content
  displayProjectContent( $(this).attr('id') );

  selectedNavItem = $(this);
});

/* Handle project nav subitem click */
$(document).on('click', '.left-nav-subitem', function() {
  $('.left-nav-item').removeClass("subitem-selected");
  $('.left-nav-subitem').removeClass("subitem-selected");

  $(this).addClass("subitem-selected");

  // Set parent nav item as 'selected'
  $('#' + $(this).parent().attr('id').split('-')[0] ).addClass("subitem-selected");

  // Display content
  displayProjectContent( $(this).attr('id') );

  selectedNavItem = $(this);
});

function resetNavbar() {
    // Hide all other subnavs
    $('.left-nav-subitems').each( function() {
        $(this).height(0);
    });

    $('.left-nav-subitem').removeClass("subitem-selected");
    

    // Hide all other subnavs
    $('.left-nav-item').each( function() {
        $(this).height(50);

        // Remove selected class
        $(this).removeClass('subitem-selected');
    });

    // Set selected as selected
    selectedNavItem.addClass('subitem-selected');
}

/* Handle 'Back' button being pressed */
$(document).on('click', '.back-btn', function() {
    location.reload();
});

// Displays content for project
function displayProjectContent(selectedItem) {
  var project = projects[selectedProject][selectedItem.replaceAll("_", " ")];

  // If undefined, selectedItem is subnav item. Find details for it.
  if( project == undefined ) {
      var parentID = $('#' + selectedItem ).parent().attr('id').split('-')[0];
      project = projects[selectedProject][parentID][selectedItem.replaceAll("_", " ")];
  }

  // If content div doesn't exist, append it
  if( !$('#project-details-content').hasClass("project-details-content") ) {
    $('#project-desc-container').append('<div id="project-details-content" class="project-details-content"></div>');
    // Add scroll button to body
    $('body').append("<div class='scrolldown-container'><div class='scrolldown-icon'><span></span><span></span><span></span></div></div>");
  }

  // Empty project-details-content div 
  $('#project-details-content').empty();

  // If selectedItem is main nav item, display content
  $('#project-details-content').append( project.content );

  var projectDetails = project;
}




String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 