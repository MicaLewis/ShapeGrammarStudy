//var camera, scene, controls, renderer, column;
//var mouse, raycaster;
//var shape;

class Display {

	constructor(id) {
		
		this.column = document.getElementById(id)
		
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setSize( this.column.clientWidth, this.column.clientHeight);
		this.column.appendChild( this.renderer.domElement );

		this.camera = new THREE.PerspectiveCamera( 70, this.column.clientWidth/this.column.clientHeight, 0.01, 1000 );
		this.camera.position.set( 0, 0, -2 );

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xcccccc );

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		
		this.shape = new voxel_list();
		
		this.shape.add(new THREE.Vector3(0,0,0), this.scene);
		
		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;

		this.controls.screenSpacePanning = false;

		this.controls.minDistance = 1;
		this.controls.maxDistance = 1000;

		this.controls.maxPolarAngle = Math.PI / 2;
		
		var thiz = this
		
		this.column.addEventListener( 'mousemove', function(event) { return thiz.onMouseMove(event) }, false );
		window.addEventListener( 'resize', function(event) { return thiz.onWindowResize(event) }, false );
		document.addEventListener( 'keydown', function(event) { return thiz.onKeyDown(event) } );
		//add an on mouse leave event to prevent editing while inside current object

	}

	animate() {
		
		var thiz = this
		
		requestAnimationFrame(function() {return thiz.animate()})
		
		this.controls.update();

		this.renderer.render( this.scene, this.camera );

	}

	onMouseMove( event ) {
		event.preventDefault();
		
		this.mouse.set( ( event.offsetX / this.column.clientWidth ) * 2 - 1, - ( event.offsetY / this.column.clientHeight) * 2 + 1 );
	}

	onKeyDown( event ) {
		event.preventDefault();
		
		this.raycaster.setFromCamera( this.mouse, this.camera )
		
		if (event.keyCode == 65) {
			var intersects = this.raycaster.intersectObjects( this.shape.objects );
			
			if ( intersects.length > 0 ) {
				var intersect = intersects[ 0 ]
				var voxel = this.shape.locationOf(intersect.object).clone()
				
				voxel.add( intersect.face.normal )
				
				this.shape.add(voxel, this.scene)
				
			}
		}
	}

	onWindowResize() {
		this.camera.aspect = this.column.clientWidth / this.column.clientHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( this.column.clientWidth, this.column.clientHeight );
	}
}