import { basic_epts } from './modules/data.js';
import { Policy, policyHeight, policyWidth, policyTypes, clonePolicy, fromJSON } from './modules/policy.js';
import { Link } from './modules/link.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
import { PolicyForm, clearForm } from './modules/policy_form.js';
import { storage } from './modules/storage.js';
import { CloningForm, addVersion } from './modules/cloning_form.js';
import { generateId } from './modules/base.js';
import { className } from './modules/utils.js';
import { Positioner } from './modules/positioner.js';

var paper = Raphael(330, 190, '600px', '600px');
var positioner = new Positioner();

function initNewPolicy(paper) {
	window.policy = new Policy(
		paper, 
		{x: 100, y: 100},
		{
			'label': 'New',
			'parameters': {},
			'input_types': ['any'],
			'output_type': 'any'
		},
		policyTypes.new
	);
	document.getElementById('ept-label').innerText = window.policy.data.label;
}

// Handler for connection type change
function updateConnectionTypes(cp) {
	let max = 0;
	let counted = cp.linkedWith.reduce((result, entity) => {
		if (entity instanceof Link) {
			((entity.from === cp ? entity.to : entity.from).types || []).forEach(type => {
				let count = result[type] + 1 || 1;
				result[type] = count;
				if (count > max) max = count;
			});
		}
		return result;
	}, {});
	cp.types = Object.keys(counted).filter(type => type !== 'any' && counted[type] === max);
	if (!cp.types.length) cp.types = ['any'];
	cp.render();
}

var addingPosition = 0;

// Hides all 
function cleanup(isNew=false) {
	addingPosition = 0;
	positioner = new Positioner();
	Array
		.from(storage.get(Policy.name, []))
		.filter(ept => !ept.isSaved)
		.forEach(ept => {
			ept.onDestruct = () => {};
			ept.destructor();
		});
}

// EPT serialization into json 
// Note, that 'parameters' here will not be regenerated automatically
// upon children parametrization changing
function gatherJSON(editedEpt) {
	let result = {
		nodes: storage.get(Policy.name, [])
			.filter(ept => !ept.isSaved && ept.type !== policyTypes.new && !ept.onlyCreate)
			.map(ept => ept.toJSON()),
		links: storage.get(ConnectionPoint.name, [])
			.filter(point => point.type === connectionPointTypes.out)
			.reduce((result, point) => {
				point.linkedWith
					.filter(connection => connection instanceof Link)
					.map(link => result.push([link.from.belongsTo, link.to.belongsTo]));
				return result;
			}, []),
		parameters: Object.assign({}, editedEpt.data.parameters)	// TODO: Gather own set parameters
	};
	return result;
}

var policyIndex = 0;
function pushPolicy(ept) {
	ept.asJSON = gatherJSON(ept);
	policyIndex++;
}

function randomizePosition(ept) {
	return positioner.position(ept);
}

function view(ept, keepPolicyForm=false) {
	cleanup();
	document.getElementById('ept-label').innerText = ept.data.label;
	if (window.policy.type === policyTypes.new) {
		window.policy.destructor();
	}
	window.policy = ept;
	printEpts();

	let availablePolicies = storage.get(Policy.name, []).reduce((result, ept) => {
		result[ept.ownId] = ept;
		return result;
	}, {});

	// Recreate nodes
	let nodes = (ept.asJSON.nodes || []).reduce((result, data) => {
		let p = fromJSON(data, availablePolicies);
		p.onDestruct = () => updatePolicyForm();
		p.render();
		result[p.ownId] = p;
		return result;
	}, {});

	// Recreate links between them
	(ept.asJSON.links || []).forEach(([from, to]) => {
		try {
			new Link(
				paper,
				from ? nodes[from].output : window.inputPoint,
				to ? nodes[to].input : window.outputPoint,
			).render();
		} catch (e) {
			console.log(e);
		}
	});
	if (!keepPolicyForm) initPolicyForm();
};

function clone(ept) {
	if (ept.type === policyTypes.elementary || !ept.asJSON.nodes.length) {
		// Just a single EPT (no children) cloning - no confirmation needed
		let cloned = ept.clone(null, true);
		cloned.id = null;
		cloned.isCloned = true;
		cloned.onlyCreate = true;
		cloned.data.label = addVersion(cloned.data.label);

		let reference = cloned.clone(policyTypes.reference);
		reference.onDestruct = () => updatePolicyForm();
		randomizePosition(reference);
		updatePolicyForm();	
	} else {
		let cloningForm = new CloningForm(ept, ept => {
			if (ept) {
				let reference = randomizePosition(ept);
				reference.onDestruct = () => updatePolicyForm();
			}
			updatePolicyForm();
		});
		cloningForm.render();
	}
};

// Creates action links for the EPT (view, reference, clone)
function createEptLink(title, ept, handler, isEnabled) {
	let li = document.createElement('li');
	li.innerText = title;
	if (isEnabled) {
		li.onclick = () => handler(ept);
	} else {
		li.className = 'disabled';
	}
	return li;
}

// Print list of EPTs stored in catalog
function printEpts() {
	var container = document.getElementById('ept-list');
	container.innerHTML = '';

	let activeOwnId = (window.policy && window.policy.ownId) || null;

	let epts = storage.get(Policy.name, []);
	epts
		.filter(p => ![policyTypes.new, policyTypes.basic, policyTypes.reference].includes(p.type))
		.forEach(p => {
			let id = p.id;
			if (p.type === policyTypes.basic) return;

			let isActive = activeOwnId === p.ownId;

			let li = document.createElement('li');
			li.innerText = p.data.label;
			li.className = className({
				[p.type]: true,
				'error': p.hasErrors,
				'clone': p.isCloned,
				'active': isActive
			});
			li.appendChild(document.createElement('span'));

			let links = document.createElement('ul');
			links.append(
				createEptLink('Clone', p, clone, !isActive),
				createEptLink('Reference', p, 
					ept => {
						let clone = randomizePosition(ept.clone(policyTypes.reference));
						clone.onDestruct = () => updatePolicyForm();
						updatePolicyForm();
					}, !isActive
				),
				createEptLink('View', p, ept => {
					clearForm();
					view(ept);
				}, true)
			);

			li.appendChild(links);

			container.appendChild(li);
		});
}

function initPolicyForm() {
	window.policy.asJSON = gatherJSON(window.policy);
	
	if (window.policyForm) delete window.policyForm;
	window.policyForm = new PolicyForm(
		window.policy,
		(data, doSave=false) => {
			if (doSave) return save();
			window.policy.data = data;
			document.getElementById('ept-label').innerText = data.label;
			printEpts();
		}, 
		false
	).render();	
}

function updatePolicyForm() {
	let policyForm = window.policyForm;
	if (policyForm) {
		window.policy.asJSON = gatherJSON(window.policy);
		policyForm.update();
	}
}

function save() {
	let ept = window.policy;
	let [input, output] = [window.inputPoint, window.outputPoint];

	Object.assign(ept.data, {
		'input_types': input.types,
		'output_type': output.types.length && output.types[0] !== 'any' ? output.types[0] : null
	});

	ept.data = clonePolicy(ept.data);
	pushPolicy(ept);

	storage.get(Policy.name, [])
		.filter(ept => !ept.isSaved && ept.type !== policyTypes.reference)
		.forEach(ept => {
			// ept.onDestruct = () => {};
			ept.save();
			ept.hide();
		});

	printEpts();
	view(ept, true);
	updatePolicyForm();
}

window.onload = () => {
	// Initialize the canvas
	let canvasWidth = paper.canvas.clientWidth;
	let canvasHeight = paper.canvas.clientHeight;

	window.policyForm = null;

	// New EPT input and output connection points
	let middle = canvasWidth / 2;
	let input = new ConnectionPoint(paper, {x: middle, y: 20}, connectionPointTypes.out, false, true, ['any']);
	input.onLinkChange = () => updateConnectionTypes(input);
	input.render();
	window.inputPoint = input;
	paper.text(middle + radius + 5, 18, 'Input').attr('text-anchor', 'start');

	let output = new ConnectionPoint(paper, {x: middle, y: canvasHeight - 20}, connectionPointTypes.in, false, true, ['any']);
	output.onLinkChange = () => updateConnectionTypes(output);
	output.render();
	window.outputPoint = output;
	paper.text(middle + radius + 5, canvasHeight - 20, 'Output').attr('text-anchor', 'start');

	// New EPTs settings button with handler
	// paper.image('./images/settings.png', 10, 0, 15, 15)
	// 	.attr('cursor', 'hand')
	// 	.click(() => {
	// 	});

	// New EPTs save button with handler
	// paper.image('./images/save.png', 30, 0, 15, 15)
	// 	.attr('cursor', 'hand')
	// 	.click(() => {
	// 	});

	// Wipe out button
	paper.image('./images/refresh.png', 10, 0, 15, 15)
		.attr('cursor', 'hand')
		.click(() => {
			cleanup();
			initNewPolicy(paper);
			clearForm();
			initPolicyForm();
			printEpts();
		});

	// Instantiate and render basic policies list from data.js
	(basic_epts || []).forEach(data => {
		let p = new Policy(paper, {x: 220, y: 230}, data, policyTypes.basic);
		p.save();
		pushPolicy(p);

		let clone = new Policy(paper, {x: 220, y: 230}, data, policyTypes.elementary);
		
		// Simulate relationship creation from elementary to basic
		let nextId = generateId();
		let basicToJson = p.toJSON();
		basicToJson.id = p.ownId;
		basicToJson.ownId = nextId;

		clone.asJSON = {
			nodes: [
				basicToJson
			],
			links: [
				[null, nextId]
			],
			parameters: Object.assign({}, basicToJson.parameters)
		};
		if (data.output_type) {
			// Only create output link if output type is not null
			clone.asJSON.links.push([nextId, null]);
		}
		clone.save();
		policyIndex++;
	});
	printEpts();
	initNewPolicy(paper);
	initPolicyForm();
};
