var rules = {}

var limbo = new THREE.Scene();


function Rule(ldisp, rdisp, primary, name) {
	
	this.ldisp = ldisp
	this.rdisp = rdisp
	this.primary = primary
	this.name = name
	
	this.lshape = new Shape(limbo, true, 0)
	this.rshape = new Shape(limbo, false, 0)
}