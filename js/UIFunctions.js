

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


function changeName() {
	
}

var matches = [ new transform( new THREE.Matrix4().scale(2), 0 ) ]

function selectMatch(index) {
	
	pr.highlight( ld.shape, matches[index] )
	
}

function findMatches() {
	matches = []
	
	left = ld.shape
	prime = pr.shape
	
	prime.nterms[left.nterm.type].forEach( function(primeNterm){
		
		t = transform( new THREE.Matrix4(), primeNterm.lvl-left.nterm.lvl )
		t.mat.setPosition(primeNterm.lvl)
		t.mat.scale(Math.pow(2, primeNterm.lvl-left.nterm.lvl))
		
		var match = matchIn(left.root, prime, transform)
		
	})
	
	return matches
}

function matchIn(v, prime, transform) {
	
	if( v == null || v.type > 1) {
		return true
	} else if( v.type == 1 ) {
		return prime.search( v.pos.clone.applyMatrix4(transform.mat),
		v.lvl + transform.lvl ).type == 1;
	} else {
		return v.childs.every( function(child){
			matchIn(child, prime, transform)
		})
	}
}


function applyMatch() {
	
}