//var camera, scene, controls, renderer, column;
//var mouse, raycaster;
//var shape;

var maction = 0;
var mlevel = -1;

document.addEventListener( 'keydown', function(event) {
	event.preventDefault();
		
	if ( event.key == 'a' )
		maction = maction == 1 ? 0 : 1
	if ( event.key == '.' )
		mlevel += 1
	if ( event.key == ',' )
		mlevel -= 1
	if ( event.key == 'r')
		maction = maction == -1 ? 0 : -1
	
	if (event.keyCode >= 48 && event.keyCode <= 57) {
		var type = event.keyCode - 46
		maction = maction == type ? 0 : type
	}

} );

class Display {

	constructor(id, aspect, lhand, max_lvl) {
		
		this.column = document.getElementById(id)
		this.aspect = aspect
		
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setSize( this.column.clientWidth, this.column.clientWidth/aspect);
		this.column.appendChild( this.renderer.domElement );

		this.camera = new THREE.PerspectiveCamera( 70, aspect, 0.01, 1000 );
		this.camera.position.set( 0, 0, -2 );

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xffffff );

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		
		this.shape = new Shape(this.scene, lhand, max_lvl);
		
		var light = new THREE.DirectionalLight( 0xffffff, 1.2 )
		light.position.set(-1, 3, -2)
		this.scene.add( light )
		var light = new THREE.DirectionalLight(0xffffff, .5)
		light.position.set(1, -3, 2)
		this.scene.add( light )
			
		this.cursor = new THREE.Mesh(
			new THREE.BoxGeometry(),
			new THREE.MeshLambertMaterial({
				color: 0xffffff, opacity: 0, transparent: true
			}))
			
		this.ground = new THREE.Mesh(
			new THREE.PlaneGeometry(256,256).rotateX(3*Math.PI/2),
			new THREE.MeshBasicMaterial({
				color: 0x000000, side: THREE.DoubleSide, opacity: 0, transparent: true
			}))
			
		this.scene.add(this.cursor)
		this.scene.add(this.ground)
		
		this.highlit = new Shape(this.scene, lhand, max_lvl)
		
		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;

		this.controls.screenSpacePanning = false;

		this.controls.minDistance = 1;
		this.controls.maxDistance = 1000;

		this.controls.maxPolarAngle = Math.PI;
		
		let thiz = this
		this.enabled = false
		
		this.renderer.domElement.addEventListener( 'mousemove', function(event) { if(thiz.enabled) thiz.onMouseMove(event) }, false );
		this.renderer.domElement.addEventListener( 'mouseenter', function(event) { thiz.enabled = true } )
		this.renderer.domElement.addEventListener( 'mouseleave', function(event) { thiz.enabled = false } )
		this.renderer.domElement.addEventListener( 'mousedown', function(event) { if(thiz.enabled) thiz.onMouseDown(event) } )

	}
	
	highlight( shape, transform ) {
		
		this.highlit.copy( shape )
		
		this.highlit.applyToObjects( function(obj) {
			obj.applyMatrix( transform )
			obj.material.opacity = .5
		} )

	}
	
	static newDisplay (id, aspect, lhand, max_lvl) {
		var disp = new Display(id, aspect, lhand, max_lvl)
		window.addEventListener( 'resize', function(event) { disp.onWindowResize(event) }, false );
		document.addEventListener( 'keydown', function(event) { disp.onKeyDown(event) } );
		return disp
	}

	animate() {
		
		let thiz = this
		
		requestAnimationFrame(function() {return thiz.animate()})
		
		this.controls.update();

		this.renderer.render( this.scene, this.camera );

	}

	onMouseMove( event ) {
		event.preventDefault();
		
		this.mouse.set( ( event.offsetX / this.column.clientWidth ) * 2 - 1, - ( event.offsetY / this.column.clientHeight) * 2 + 1 );
		
		this.updateCursor()
	}

	onKeyDown( event ) {
		
		event.preventDefault();
		
		this.cursor.material.color = new THREE.Color( typeColor( maction ) )
		
		this.controls.enabled = maction == 0
		
		this.updateCursor()
		
	}
	
	updateCursor () {
		
		this.raycaster.setFromCamera( this.mouse, this.camera )
		let objs = this.shape.objects(mlevel).concat(this.ground)
		var intersects = this.raycaster.intersectObjects( objs, true );
		
		if ( intersects.length > 0 && maction > 0 ) {
			
			this.cursor.material.opacity = .6
			
			var loc = intersects[0].point.clone()
			loc.add( intersects[0].face.normal.clone().multiplyScalar( Math.pow( 2, mlevel-1 ) ) )
			
			loc.divideScalar( Math.pow( 2, mlevel ) ).floor().multiplyScalar( Math.pow( 2, mlevel ) )
			var scl = new THREE.Vector3(1,1,1).multiplyScalar(Math.pow( 2, mlevel ))
			
			this.cursor.scale.copy( scl )
			this.cursor.position.addVectors( loc, scl.divideScalar(2) )
			
		} else if ( intersects.length > 0 && maction == -1 ) {
			
			this.cursor.material.opacity = .6
			
			var loc = intersects[0].point.clone()
			loc.sub( intersects[0].face.normal.clone().multiplyScalar( Math.pow( 2, mlevel-1 ) ) )
			
			loc.divideScalar( Math.pow( 2, mlevel ) ).floor().multiplyScalar( Math.pow( 2, mlevel ) )
			var scl = new THREE.Vector3(1,1,1).multiplyScalar(Math.pow( 2, mlevel ))
			
			this.cursor.scale.copy( scl.clone().multiplyScalar(1.05) )
			this.cursor.position.addVectors( loc, scl.divideScalar(2) )
			
		} else {
			this.cursor.material.opacity = 0
		}
	}
	
	onMouseDown (event) {
		
		event.preventDefault();
		
		this.mouse.set( ( event.offsetX / this.column.clientWidth ) * 2 - 1, - ( event.offsetY / this.column.clientHeight) * 2 + 1 );
		this.raycaster.setFromCamera( this.mouse, this.camera )
		
		let objs = this.shape.objects(mlevel).concat(this.ground)
		var intersects = this.raycaster.intersectObjects( objs, true );
		
		if ( intersects.length > 0 ) {
			
			var loc = intersects[0].point.clone()
			
			if ( maction > 0 ) {
				
				loc.add( intersects[0].face.normal.clone().multiplyScalar( Math.pow( 2, mlevel-1 ) ) )
				this.shape.add( loc, mlevel, maction )
				
			} else if ( maction == -1 ) {
				
				loc.sub( intersects[0].face.normal.clone().multiplyScalar( Math.pow( 2, mlevel-1 ) ) )
				this.shape.remove( loc, mlevel )
				
			}
		}
	}

	onWindowResize() {
		this.camera.aspect = this.aspect;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( this.column.clientWidth, this.column.clientWidth/this.aspect );
	}
}

var ld = Display.newDisplay("l_col", 4/3, true, -1)
var rd = Display.newDisplay("r_col", 4/3, false, -1)
var pr = Display.newDisplay("primary", 16/9, false, Infinity)
ld.animate()
rd.animate()
pr.animate()