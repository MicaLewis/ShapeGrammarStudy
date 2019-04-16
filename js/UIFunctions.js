

function selectRule(name) {
	
	var rule = rules[name]
	
	if( $("#current-rule").val() in rules ) {
		var oldRule = rules[$("#current-rule").val()]
		
		oldRule.lshape.copy(ld.shape, limbo)
		oldRule.rshape.copy(rd.shape, limbo)
	}
	
	ld.shape.copy(rule.lshape, ld.scene)
	rd.shape.copy(rule.rshape, rd.scene)
	
	$("#current-rule").val(name)
}

var ruleCount = 0
function newRule() {
	var name = "Rule #" + ruleCount
	ruleCount ++
	
	var rule = new Rule(ld, rd, primary, name)
	rules[name] = rule
	
	$("#rule-menu").append('<a class="dropdown-item" href="#" onclick="selectRule(\''+name+'\')">'+name+'</a>')
	
	selectRule(name)
}
newRule()


function changeName() {
	
}

function selectMatch(index) {
	
}


function findMatches() {
	var matches = []
	
	return matches
}

function applyMatch() {
	
}