//voxel.js

class voxel_list {
	
	constructor() {
		this.voxels = []
		this.objects = []
		
		this.geometry = new THREE.BoxGeometry( 1, 1, 1 )
		this.normmat = new THREE.MeshNormalMaterial()
		this.highmat = new THREE.MeshBasicMaterial()

		this.mesh = new THREE.Mesh( this.geometry, this.normmat )
	}
	
	add(v, scene) {
		var index = this.isFilled(v)
		if ( index == -1 ) {
			this.voxels.push(v)
			var new_mesh = new THREE.Mesh( this.geometry, this.normmat )
			new_mesh.position.add(v)
			this.objects.push(new_mesh)
			scene.add(new_mesh)
			return true
		} else {
			return false
		}
		
	}
	
	highlight(vs) {
		var i
		var myVoxel
		for( i = 0; i < this.voxels.length; i++ ) {
			myVoxel = this.voxels[i]
			if( vs.findIndex(function(e){return e.equals(myVoxel)}) != -1 ) {
				this.objects[i].material = this.highmat
			} else {
				this.objects[i].material = this.normmat
			}
		}
	}
	
	isFilled(v) {
		return this.voxels.findIndex(function(e){return e.equals(v)})
	}
	
	locationOf(o) {
		var index = this.objects.indexOf(o)
		return this.voxels[index]
	}
	
	objectAt(v) {
		var index = this.isFilled(v)
		if (index == -1) {
			return null
		} else {
			return this.objects[index]
		}
	}
	
	remove(v, scene) {
		var index = this.isFilled(v)
		if ( index != -1 ) {
			var removed = objects.splice(index, 1)
			scene.remove(removed)
			this.voxels.splice(index, 1)
		}
	}
}