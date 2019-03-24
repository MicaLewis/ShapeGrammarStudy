//voxel.js

var geo = new THREE.BoxGeometry()
var wiregeo = new THREE.EdgesGeometry( geo );

var normmat = new THREE.MeshLambertMaterial()
var highmat = new THREE.MeshBasicMaterial({color: 0xff0000})
var ntermmat = new THREE.MeshLambertMaterial({color: 0xffffff})
var wiremat = new THREE.LineBasicMaterial( { color: 0x000000 } )
var invismat = new THREE.MeshBasicMaterial({visible:false})

function typeColor ( type ) {
	
	if (type == 0) return 0xffffff
	
	if (type == 1) return 0xcccccc
	
	var c = new THREE.Color()
	c.setHSL( (type - 2)/10.0, 1, 0.5 )
	
	return c.getHex()
}

function Voxel (pos, type, lvl, par, scene) {
	
	this.pos = pos
	this.lvl = lvl
	this.type = type
	this.par = par
	this.childs = [null, null, null, null, null, null, null, null]
	
	this.cube = new THREE.Mesh( geo, invismat )
	if(type < 1) {
		this.object = new THREE.LineSegments( wiregeo, wiremat )
	} else if (type == 1) {
		this.object = new THREE.Mesh( geo, normmat )
	} else {
		this.object = new THREE.Mesh( geo, ntermmat.clone() )
		this.object.material.color = new THREE.Color( typeColor(type) )
	}
	
	this.object.position.addVectors( pos, new THREE.Vector3().setScalar( Math.pow(2, lvl-1) ) )
	this.object.scale.setScalar(Math.pow(2, lvl))
	this.cube.position.addVectors( pos, new THREE.Vector3().setScalar( Math.pow(2, lvl-1) ) )
	this.cube.scale.setScalar(Math.pow(2, lvl))
	
	scene.add(this.cube)
	scene.add(this.object)
}

class Shape {
	
	constructor(scene, lhand) {
		
		this.solids = []
		this.boundaries	= {}
		
		this.nterm = null
		
		var start_lvl = 3
		
		this.scene = scene
		
		this.root = this.create( (new THREE.Vector3()).subScalar( Math.pow(2, start_lvl-1) ), 0, start_lvl, null )
		this.root.object.material = new THREE.LineBasicMaterial( { color: 0xff0000 } )
		
		if ( lhand == true ) {
			this.nterm = this.add(new THREE.Vector3(0, 0, 0), 0, 2);
		}
		
	}
	
	// calculates index in childs list of a given position
	/* 0: x-, y-, z-
	   1: x-, y-, z+
	   2: x-, y+, z-
	   3: x-, y+, z+
	   4: x+, y-, z-
	   5: x+, y-, z+
	   6: x+, y+, z-
	   7: x+, y+, z+ */
	childIndex(v, pos) {
		var xx = pos.x >= v.pos.x + Math.pow(2, v.lvl-1) ? 4 : 0
		var yy = pos.y >= v.pos.y + Math.pow(2, v.lvl-1) ? 2 : 0
		var zz = pos.z >= v.pos.z + Math.pow(2, v.lvl-1) ? 1 : 0
		return xx+yy+zz
	}
	
	childPos(index, v) {
		var spc = Math.pow(2, v.lvl-1)
		var p = v.pos.clone()
		return p.add( new THREE.Vector3( (index >> 2)*spc, ((index & 2) >> 1)*spc, (index & 1)*spc ) )
	}
	
	oob(v, pos) {
		return pos.x < v.pos.x ||  pos.x > v.pos.x + Math.pow(2, v.lvl) ||
			pos.y < v.pos.y ||  pos.y > v.pos.y + Math.pow(2, v.lvl) ||
			pos.z < v.pos.z ||  pos.z > v.pos.z + Math.pow(2, v.lvl) ;
	}
	
	// handles all object related functions of creating a new voxel
	create(pos, type, lvl, par) {
		
		var newVoxel = new Voxel(pos, type, lvl, par, this.scene)
		
		if (type != 0) {
			this.solids.push(newVoxel.cube)
		} else {
			if( !( lvl in this.boundaries ) )
				this.boundaries[lvl] = []
			this.boundaries[lvl].push(newVoxel.cube)
		}
		
		return newVoxel
	
	}
	
	// handles changing of type
	retype(v, type) {
		
		v.type = type
		this.scene.remove(v.object)
		
		var scl = v.object.scale
		var pos = v.object.position
		
		if(type < 1) {
			
			v.object = new THREE.LineSegments( wiregeo, wiremat )
			this.solids.splice(this.solids.indexOf(v.cube), 1);
			
		} else if (type == 1) {
			
			v.object = new THREE.Mesh( geo, normmat )
			this.solids.push(v.cube)
			
		} else {
			
			v.object = new THREE.Mesh( geo, ntermmat )
			v.object.material.color = new THREE.Color( typeColor(type) )
			this.solids.push(v.cube)
			
		}
		
		v.object.scale.copy(scl)
		v.object.position.copy(pos)
		
		this.scene.add(v.object)
		
	}
	
	// handles deletion of voxel, recursively deletes all childs
	del(v) {
		
		if (v == null) return
		
		this.scene.remove(v.object)
		this.scene.remove(v.cube)
		
		if ( v.type == 0 ) {
			this.boundaries[v.lvl].splice(this.solids.indexOf(v.cube), 1)
		} else {
			this.solids.splice(this.solids.indexOf(v.cube), 1);
		}
		
		v.par.childs[v.par.childs.indexOf(v)] = null
		
		for( var i = 0; i < 8; i++ ) {
			if( v.childs[i] != null ) {
				this.del(v.childs[i])
			}
		}
		
		
	}
	
	objects(lvl) {
		if (lvl in this.boundaries)
			return this.solids.concat(this.boundaries[lvl])
		else
			return this.solids
	}
	
	// Breaks a type1 voxel into 8 type1 nodes
	crack(v) {
		
		if (v.type != 1) return false
		
		this.retype(v, 0)
		
		for( var i = 0; i < 8; i++ ) {
			v.childs[i] = this.create( this.childPos(i, v), 1, v.lvl-1, v )
		}
	}

	// Merges all childs into v if they are all the same non type0 type.
	// Is called recursively on all parents except root
	merge(v) {
		
		var same = (v.childs[0] != null || v.type != 0) && v != this.root && v.childs[0] != 0
		
		for( var i = 1; i < 8; i++ ) {
			if ( !same || v.childs[i] == null || v.childs[i].type != v.childs[0].type ) {
				same = false
			}
		}
		
		if (same) {
			
			var type = v.childs[0].type
			for( var i = 0; i < 8; i++ ) {
				this.del( v.childs[i] )
			}
			this.retype(v, type)
			
			return this.merge(v.par)
			
		} else {
			return v
		}
	}
	
	clear(v) {
		
		var same = v != this.root
		
		for( var i = 0; i < 8; i++ ) {
			if ( v.childs[i] != null ) {
				same = false
			}
		}
		
		if (same) {
			
			var par = v.par
			this.del(v)
			this.clear(par)
			
		}
	}
	
	add(pos, lvl, type) {
		
		if( this.oob(this.root, pos) ) {
			//add root expansion later
			return null
		}
		
		return this.addIn( this.root, pos, lvl, type )
		
	}
	
	addIn( v, pos, lvl, type) {
		
		var index = this.childIndex(v, pos)
		
		if( v.type == 1 ) {
			
			if( type == 1 ) {
				return true
				
			} else if ( type > 1 ) {
				
				this.crack(v)
				
				if( v.lvl-1 == lvl ) {
					
					v.childs[index] = this.create( this.childPos(index, v), type, lvl, v)
					return true
					
				} else {
					return this.addIn( v.childs[index], pos, lvl, type )
				}
			}
			
		} else if (v.type > 1) {
			
			// Do not crack non terminals
			return null
			
		} else if( v.childs[index] == null ) {
			
			if( v.lvl-1 > lvl ) {
				
				//fill in with new type 0 voxels
				v.childs[index] = this.create( this.childPos(index, v), 0, v.lvl-1, v )
				this.merge(v)
				return this.addIn( v.childs[index], pos, lvl, type )
				
			} else {
				
				v.childs[index] = this.create( this.childPos(index, v), type, lvl, v )
				return this.merge(v)
			}
			
		} else if( v.lvl-1 > lvl ) {
			return this.addIn( v.childs[index], pos, lvl, type )
			
		} else if( v.childs[index].type != 0 ) {
			v.childs[index] = this.create( this.childPos(index, v), type, lvl, v )
			return this.merge(v)
			
		}
	}

	search( pos, lvl ) {
		
		if( this.oob(this.root, pos) ) {
			//add root expansion later
			return false
		}
		
		return searchIn(this.root, pos, lvl, scene)
		
	}
	
	// returns type at given position and level
	// Am I sure I should return type?
	searchIn( v, pos, lvl ) {
		
		var index = this.childIndex(v, pos)
		
		if( v == null ) {
			return -1
		} else if( v.type > 0 || lvl == v.lvl) {
			return v
		} else {
			return this.searchIn(v.childs[index], pos, lvl)
		}
		
	}
	
	remove( pos, lvl ) {
		
		if( this.oob(this.root, pos) ) {
			//add root expansion later
			return false
		}
		
		return this.removeIn( this.root, pos, lvl )
	}
	
	removeIn( v, pos, lvl ) {
		
		if(v == null) return false
		
		var index = this.childIndex( v, pos )
		
		if( v.type > 1 || v.lvl == lvl ) {
			
			var par = v.par
			this.del(v)
			this.clear(par)
			return true
			
		} else if ( v.type == 1 ) {
			
			this.crack(v)
			return this.removeIn(v.childs[index], pos, lvl)
			
		} else {
			
			return this.removeIn(v.childs[index], pos, lvl)
			
		}
	}
	
	// left hand shapes only, lvl is relative.
	rescale (lvl) {
		return //new shape
	}
	
	match (lhand) {
		return [] // list of locations
	}
	
	// only highlights left hand shapes
	highlight (lhand, loc, lvl) {
		
	}
	
	replace (lhand, rhand, loc, lvl) {
		
	}
	
}