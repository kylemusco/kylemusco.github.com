

$(function () { 
  var scene    = new THREE.Scene(); 
  var camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000); 
  var renderer = new THREE.WebGLRenderer(); 

  renderer.setSize(window.innerWidth, window.innerHeight);  

  // Space background is a large sphere
  var spacetex = THREE.ImageUtils.loadTexture("images/space.png");
  var spacesphereGeo = new THREE.SphereGeometry(40, 40, 40);
  var spacesphereMat = new THREE.MeshPhongMaterial({
    map:         spacetex,
    side:        THREE.DoubleSide,
    transparent: true,
    opacity:     1.0
  });
  spacesphereMat.map.wrapS = THREE.RepeatWrapping; 
  spacesphereMat.map.wrapT = THREE.RepeatWrapping;
  spacesphereMat.map.repeat.set(20, 10);

  var spacesphere = new THREE.Mesh(spacesphereGeo, spacesphereMat);
  scene.add(spacesphere);
 
  // position camera
  camera.position.set(0, 0, -15);
  camera.lookAt(scene.position); 
  
  // lights
  var spotLight1 = new THREE.SpotLight(0xffffff, 0.1);
  spotLight1.position.set(-40, 60, -10);
  scene.add(spotLight1);

  var spotLight2 = new THREE.SpotLight(0x5192e9, 2);
  spotLight2.position.set(40, -60, 30);
  scene.add(spotLight2);

  $("#space").append(renderer.domElement); 

  var fadeRate  = 0.05;

  // render loop
  function render() { 
    requestAnimationFrame(render); 

    // slow spin on desktop
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      spacesphere.rotation.y += 0.00003;
    }

    // fade out when partyTime is active
    if (partyTime && spacesphere.material.opacity > 0) {
      spacesphere.material.opacity = Math.max(spacesphere.material.opacity - fadeRate, 0);
    }
    
    renderer.render(scene, camera); 
  }

  render();
});
