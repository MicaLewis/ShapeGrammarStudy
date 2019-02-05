var camera, scene, controls, renderer;
var geometry, material, mesh;

init();
animate();

function init() {
	
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.set( 0, 0, -2 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xcccccc );

	geometry = new THREE.BoxGeometry( 1, 1, 1 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
	
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;

	controls.screenSpacePanning = false;

	controls.minDistance = 1;
	controls.maxDistance = 1000;

	controls.maxPolarAngle = Math.PI / 2;
	
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	scene.add( light );

}

function animate() {

	requestAnimationFrame( animate );
	
	controls.update();
	
	//mesh.scale.x += 1
	//mesh.scale.y += 1;
	//mesh.scale.z += 1;
	
	//camera.position.z += .1

	renderer.render( scene, camera );

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}