import { basic_epts } from './modules/data.js';
import { Policy, policyHeight, policyWidth, policyTypes, clonePolicy, fromJSON } from './modules/policy.js';
import { Link } from './modules/link.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
import { PolicyForm, clearForm } from './modules/policy_form.js';
import { storage } from './modules/storage.js';

function initNewPolicy(paper) {
	window.policy = new Policy(
		paper, 
		{x: 100, y: 100},
		{
			'label': 'New',
			'node': '',
			'parameters': {},
			'input_types': ['any'],
			'output_type': 'any'
		},
		policyTypes.new
	);
}

function gatherUnsetParameters() {
	window.policy.data.parameters = storage.get('Policy', []).reduce((result, policy) => {
		if ([policyTypes.basic, policyTypes.new, policyTypes.custom].includes(policy.type)) return result;
		let parameters = policy.data.parameters || {};
		Object.keys(parameters).forEach(parameter => {
			let p = parameters[parameter];
			if (!p) result[parameter] = p;
		});
		return result;
	}, {});
}

function cleanup() {
	Array.from(storage.get('Policy', [])).forEach(policy => {
		if (policy.type === policyTypes.reference) {
			policy.destructor()
		} else if (policy.type === policyTypes.cloned) {
			keepPolicyInCatalog(policy);
			policy.destructor(true);
		}
	});
}

function updateConnectionTypes(cp) {
	let max = 0;
	let counted = cp.linkedWith.reduce((result, entity) => {
		if (entity instanceof Link) {
			(entity.from === cp ? entity.to : entity.from).types.forEach(type => {
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

function keepPolicyInCatalog(policy) {
	let availablePolicies = storage.get('available_policies', {});
	let exists = availablePolicies.hasOwnProperty(policy.id);
	availablePolicies[policy.id] = policy;
	storage.set('available_policies', availablePolicies);
	return exists;
}

function gatherJSON() {
	return {
		nodes: storage.get('Policy', [])
			.filter(ept => ept.wasTouched)
			.map(ept => ept.toJSON()),
		links: storage.get('ConnectionPoint', [])
			.filter(point => point.type === connectionPointTypes.out)
			.reduce((result, point) => {
				point.linkedWith
					.filter(connection => connection instanceof Link)
					.map(link => result.push([link.from.belongsTo, link.to.belongsTo]));
				return result;
			}, [])
	};
}

var policyIndex = 0;
function pushPolicy(ept) {
	ept.asJSON = gatherJSON();
	if (!keepPolicyInCatalog(ept)) policyIndex++;
}

function createEptLink(title, ept, handler) {
	let li = document.createElement('li');
	li.innerText = title;
	li.onclick = () => handler(ept);
	return li;
}

// Print list of EPTs stored in catalog
function printEtps(paper) {
	var container = document.getElementById('ept-list');
	container.innerHTML = '';

	let epts = storage.get('available_policies', {});
	Object.keys(epts).forEach(id => {
		let p = epts[id];
		let li = document.createElement('li');
		li.innerText = p.data.label;
		li.className = p.type;
		li.appendChild(document.createElement('span'));

		let links = document.createElement('ul');
		links.appendChild(createEptLink('Insert', p, (ept) => ept.clone(policyTypes.reference).render()));

		if (p.type !== policyTypes.basic) {
			links.append(
				createEptLink('Clone', p, (ept) => ept.clone(policyTypes.cloned).render()),
				createEptLink('View', p, (ept) => {
					window.policy = ept;
					let availablePolicies = storage.get('available_policies', {});
					let nodes = (ept.asJSON.nodes || []).reduce((result, data) => {
						let p = fromJSON(data, availablePolicies);
						p.render();
						result[p.ownId] = p;
						return result;
					}, {});
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
				})
			);
		}

		li.appendChild(links);

		container.appendChild(li);
	});
}

window.onload = () => {
	// Initialize the canvas
	let paper = Raphael(200, 0, '600px', '600px');
	let canvasWidth = paper.canvas.clientWidth;
	let canvasHeight = paper.canvas.clientHeight;

	// New EPT input and output connection points
	let middle = canvasWidth / 2;
	let input = new ConnectionPoint(paper, {x: middle, y: 20}, connectionPointTypes.out, false, true, ['any']);
	input.onLinkChange = () => updateConnectionTypes(input);
	input.render();
	window.inputPoint = input;
	paper.text(middle + radius + 5, 18, 'Input').attr('text-anchor', 'start');

	let output = new ConnectionPoint(paper, {x: middle, y: canvasHeight - 20}, connectionPointTypes.in, false, false, ['any']);
	output.onLinkChange = () => updateConnectionTypes(output);
	output.render();
	window.outputPoint = output;
	paper.text(middle + radius + 5, canvasHeight - 20, 'Output').attr('text-anchor', 'start');

	// New EPTs settings button with handler
	paper.image('/images/settings.png', 40, 20, 20, 20)
		.attr('cursor', 'hand')
		.click(() => {
			gatherUnsetParameters();
			new PolicyForm(window.policy, data => {
				window.policy.data = data;
			})
				.render();
		});

	// New EPTs save button with handler
	paper.image('/images/save.png', 65, 20, 20, 20)
		.attr('cursor', 'hand')
		.click(() => {
			let ept = window.policy;
			Object.assign(ept.data, {
				'input_types': input.types,
				'output_type': output.types.length ? output.types[0] : null
			});
			if (ept.type === policyTypes.new) ept.type = policyTypes.custom;
			pushPolicy(ept);
			initNewPolicy();
			cleanup();
			printEtps(paper);
			clearForm();
		});

	// Create and render basic policies list from data.js
	(basic_epts || []).forEach(data => {
		let p = new Policy(paper, {x: 100, y: 100}, data, policyTypes.basic);
		if (data.id) p.id = data.id;
		pushPolicy(p);
	});
	printEtps();
	initNewPolicy();
};
