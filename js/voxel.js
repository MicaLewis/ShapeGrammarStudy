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
	this.object.scale.setScalar( Math.pow(2, lvl) )
	this.cube.position.addVectors( pos, new THREE.Vector3().setScalar( Math.pow(2, lvl-1) ) )
	this.cube.scale.setScalar( Math.pow(2, lvl) )
	
	scene.add(this.cube)
	scene.add(this.object)
}

function transform( m, l ) {
	this.mat = m
	this.lvl = l
}

const start_lvl = 3

class Shape {
	
	constructor(scene, lhand, max_lvl) {
		
		this.solids = [] // list of all bounding boxes of non terminals and terminals for collisions
		this.boundaries	= {} // dict of all type 0 (branch)
		this.nterms = {}
		
		this.nterm = null
		this.max_lvl = Infinity
		if(max_lvl != undefined)
			this.max_lvl = max_lvl
		
		this.scene = scene
		
		this.root = this.create( (new THREE.Vector3()).subScalar( Math.pow(2, start_lvl-1) ), 0, start_lvl, null )
		this.root.object.material = new THREE.LineBasicMaterial( { color: 0xff0000 } )
		
		if ( lhand == true ) {
			this.nterm = this.add(new THREE.Vector3(0, 0, 0), max_lvl, 2);
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
		
		if (type == 1) {
			this.solids.push(newVoxel.cube)
			
		} else if(type > 1) {
			if( !( type in this.nterms ) )
				this.nterms[type] = []
			this.nterms[type].push(newVoxel)
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
			
			if( !( v.lvl in this.boundaries ) )
				this.boundaries[v.lvl] = []
			this.boundaries[v.lvl].push(v.cube)
			
		} else if (type == 1) {
			
			v.object = new THREE.Mesh( geo, normmat )
			this.solids.push(v.cube)
			this.boundaries[v.lvl].splice(this.solids.indexOf(v.cube), 1)
			
			if( this.boundaries[v.lvl] != undefined && v.cube in this.boundaries[v.lvl] )
				this.boundaries[v.lvl].splice(this.solids.indexOf(v.cube), 1)
			
		} else {
			
			// remove current place in nterm list
			this.nterms[v.type].splice(this.nterms[v.type].indexOf(v), 1)
			
			// re-push into correct list
			if( !( type in this.nterms ) )
				this.nterms[type] = []
			this.nterms[type].push(newVoxel.cube)
			
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
		
		if ( v.type < 1 ) {
			this.boundaries[v.lvl].splice(this.boundaries[v.lvl].indexOf(v.cube), 1)
			
		} else if ( v.type > 1) {
			this.nterms[v.type].splice(this.nterms[v.type].indexOf(v), 1)
			
		} else {
			this.solids.splice(this.solids.indexOf(v.cube), 1);
		}
		
		if( v != this.root )
			v.par.childs[v.par.childs.indexOf(v)] = null;
		
		for( var i = 0; i < 8; i++ ) {
			this.del(v.childs[i])
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
			
			if( v.lvl < this.max_lvl ) {
				return this.merge(v.par)
			} else {
				return v
			}
			
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
		
		if( this.oob(this.root, pos) || lvl > this.max_lvl || ( this.nterm != null && type > 1 ) ) {
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
				return this.merge(v.childs[index])
			}
			
		} else if( v.lvl-1 > lvl ) {
			return this.addIn( v.childs[index], pos, lvl, type )
			
		} else if( v.childs[index].type != 0 ) {
			v.childs[index] = this.create( this.childPos(index, v), type, lvl, v )
			return this.merge(v.childs[index])
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
	searchIn( v, pos, lvl ) {
		
		var index = this.childIndex(v, pos)
		
		if( v == null ) {
			return null
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
		
		if( v == null || v == this.nterm ) return false
		
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
	
	copy ( shape, scene ) {
		
		if(shape != this) {
			this.del( this.root );
			
			this.scene = scene
			
			this.root = this.create( (new THREE.Vector3()).subScalar( Math.pow(2, start_lvl-1) ), 0, start_lvl, null )
			this.root.object.material = new THREE.LineBasicMaterial( { color: 0xff0000 } )
			this.nterm = shape.nterm
			this.copyIn(shape.root)
		}
	}
	
	copyIn ( v ) {
		
		if ( v == null ) return
		
		if ( v.type == 0 ) {
			for ( var i = 0; i < 8; i++ ) {
				this.copyIn( v.childs[i] )
			}
		}
		
		if ( v.type > 0 ) {
			this.add( v.pos, v.lvl, v.type )
		}
	}
	
	// applies function argument to all objects
	applyToObjects ( to_obj ) {
		this.applyIn( this.root, to_obj )
	}
	
	applyIn ( v, to_obj ) {
		
		if ( v != null ) {
			
			to_obj( v.object )
			
			for ( var i = 0; i < 8; i++ ) {
				applyIn( v.childs[i], to_obj )
			}
		}
	}
	
	replace (lhand, rhand, transform) {
		
	}
	
}