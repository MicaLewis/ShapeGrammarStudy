var ld = new Display("l_col")
var rd = new Display("r_col")
ld.animate()
rd.animate()


function match() {
	var match = []
	var origin
	var matching_point
	var rorigin = rd.shape.voxels[0]
	var isMatch = true
	ld.shape.voxels.some(function(lel) {
		
		isMatch = true
		origin = rd.shape.voxels[0].clone()
		
		rd.shape.voxels.forEach(function(rel) {
			matching_point = lel.clone().add(rel).add(origin)
			index = ld.shape.isFilled(matching_point)
			if ( isMatch && index != -1 ) {
				match.push(matching_point)
			} else {
				isMatch = false
				match = []
			}
		})
		
		return isMatch;
		
		
	})
	ld.shape.highlight(match)
	return match
}

document.addEventListener( 'keydown', function(event) { console.log(match()) } );