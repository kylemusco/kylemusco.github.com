

$(function () { 
  var scene = new THREE.Scene(); 
  var camera = new THREE.PerspectiveCamera(45 , window.innerWidth / window.innerHeight , 0.01, 1000); 
  var renderer = new THREE.WebGLRenderer(); 

  renderer.setSize(window.innerWidth, window.innerHeight);  
  
  //Space background is a large sphere
  var spacetex = THREE.ImageUtils.loadTexture("images/space.png");
  
  var spacesphereGeo = new THREE.SphereGeometry(40,40,40);
  var spacesphereMat = new THREE.MeshPhongMaterial();
  spacesphereMat.map = spacetex;

  var spacesphere = new THREE.Mesh(spacesphereGeo,spacesphereMat);
  
  //spacesphere needs to be double sided as the camera is within the spacesphere
  spacesphere.material.side = THREE.DoubleSide;
  
  spacesphere.material.map.wrapS = THREE.RepeatWrapping; 
  spacesphere.material.map.wrapT = THREE.RepeatWrapping;
  spacesphere.material.map.repeat.set( 20, 10);
  //spacesphere.material.map.repeat.set( 20, 12);
  
  scene.add(spacesphere);
 
  //position camera
  camera.position.x = 0; 
  camera.position.y = 0; 
  camera.position.z = -15; 
  camera.lookAt(scene.position); 
  
  //create two spotlights to illuminate the scene
  var spotLight = new THREE.SpotLight( 0xffffff ); 
  spotLight.position.set( -40, 60, -10 ); 
  spotLight.intensity = .1;
  scene.add( spotLight );

  var spotLight2 = new THREE.SpotLight( 0x5192e9 ); 
  spotLight2.position.set( 40, -60, 30 ); 
  spotLight2.intensity = 2;
  scene.add( spotLight2 );

  $("#space"). append(renderer.domElement); 
 
  //call render loop once
  render();
  
  //render loop
  function render() { 
    requestAnimationFrame(render); 

    if( !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ) {
      spacesphere.rotation.y += 0.00003;
    }
    
    renderer.render(scene, camera); 
  };

});
