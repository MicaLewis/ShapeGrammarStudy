
$( document ).ready( function() {
	
	var slct = function(event) {
		var index = $("#current-match").val()
		if( index != "" && index < matches.length && index >= 0 )
			selectMatch( $("#current-match").val() )
	}
	
	$("#current-match").change( slct )
	$("#current-match").click( slct )
	$("#current-match").width(100)
	$("#current-rule").width(100)
	
	$("#apply-match").click( function(){applyMatch( $("#current-match").val() )} )
	
	$("canvas").css({"border-color": "#333333", "border-width":"1px", "border-style":"solid"});
})

function selectRule(name) {
	
	var rule = rules[name]
	
	if( $("#current-rule").val() in rules ) {
		var oldRule = rules[$("#current-rule").val()]
		
		oldRule.lshape.copy(ld.shape, limbo)
		oldRule.rshape.copy(rd.shape, limbo)
	}
	
	ld.shape.copy(rule.lshape)
	rd.shape.copy(rule.rshape)
	
	$("#current-rule").val(name)
	
	resetMatches()
}

var ruleCount = 0
function newRule() {
	var name = "Rule #" + ruleCount
	ruleCount ++
	
	var rule = new Rule(ld, rd, pr, name)
	rules[name] = rule
	
	$("#rule-menu").append('<a class="dropdown-item" href="#" onclick="selectRule(\''+name+'\')">'+name+'</a>')
	
	selectRule(name)
}
newRule()

function ruleColor( c ) {
	
	ld.shape.retype( ld.shape.nterm, c )
	
}

function changeName() {
	
}

var matches = []

function selectMatch(index) {
	
	pr.highlight( ld.shape, matches[index] )
	
}

function applyMat4(pos, transform) {
	
	var newPos = pos.clone()
	
	var translation = new THREE.Vector3()
	var quaternion = new THREE.Quaternion()
	var scale = new THREE.Vector3()
	
	transform.mat.decompose(translation, quaternion, scale)
	
	newPos.multiply(scale)
	newPos.applyQuaternion(quaternion)
	newPos.add(translation)

	return newPos
}

function resetMatches() {
	matches = []
	$("#current-match").prop( "disabled", true );
	$("#current-match").val("")
	$("#current-match").width(176)
	pr.removeHighlight()
}

function findMatches() {
	matches = []
	
	left = ld.shape
	prime = pr.shape
	
	if( left.nterm.type in prime.nterms ) {
		prime.nterms[left.nterm.type].forEach( function(primeNterm){
			
			t = new Transform( new THREE.Matrix4(), primeNterm.lvl-left.nterm.lvl )
			t.mat.multiplyScalar(Math.pow(2, primeNterm.lvl-left.nterm.lvl))
			t.mat.setPosition(primeNterm.pos)
			
			m = matchIn(left.root, prime, t)
			
			if( matchIn(left.root, prime, t) ){
				matches.push(t)
			}
				
		})
		
		if(matches.length > 0) {
			$("#current-match").prop( "disabled", false );
			$("#current-match").val(0);
			$("#current-match").prop( "max", matches.length - 1 ); 
			selectMatch(0)
		} else {
			resetMatches()
		}
	}
	
	
	
	return matches
}

function matchIn(v, prime, transform) {
	
	if( v == null || v.type > 1) {
		return true
	} else if( v.type == 1 ) {
		
		res = prime.search( applyMat4(v.pos, transform), v.lvl + transform.lvl )
		
		return res != null && res.type == 1
		
	} else {
		return v.childs.every( function(child){
			return matchIn(child, prime, transform)
		})
	}
}

function applyMatch(index) {
	
	if (index == "") return 
	
	removeAllIn(ld.shape.root, pr.shape, matches[index])
	addAllIn(rd.shape.root, pr.shape, matches[index])
	
	resetMatches()
	
}

function removeAllIn(v, prime, transform) {
	
	if (v == null) return
	
	if (v.type > 0) {
		prime.remove( applyMat4(v.pos, transform), v.lvl + transform.lvl )
	} else {
		v.childs.forEach( function(child){
			removeAllIn(child, prime, transform)
		})
	}
	
}

function addAllIn(v, prime, transform) {
	
	if (v == null) return
	
	if (v.type > 0) {
		prime.add( applyMat4(v.pos, transform), v.lvl + transform.lvl, v.type )
	} else {
		v.childs.forEach( function(child){
			addAllIn(child, prime, transform)
		})
	}
	
}