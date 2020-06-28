import { etp } from './modules/data.js';
import { Policy, policyHeight, policyWidth, policyTypes, clonePolicy } from './modules/policy.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
import { PolicyForm } from './modules/policy_form.js';
import { storage } from './modules/storage.js';

storage.set('connection_points', []);

function reRenderPolicies() {
	let renderPolicies = new CustomEvent('render_policies', {});
	window.dispatchEvent(renderPolicies);
}

function makeCloneLink(paper, policy) {
	let cloningPosition = {
		x: policy.position.x - 20,
		y: policy.position.y + 10,
	};
	let cloneLink = paper.text(policy.position.x + policyWidth + 20, policy.position.y + policyHeight / 2, 'Clone')
		.attr({
			'cursor': 'hand',
			'fill': 'blue',
		})
		.click(() => {
			let clonedPolicy = policy.clone();
			clonedPolicy.position = cloningPosition;
			clonedPolicy.wasMoved = true;
			clonedPolicy.type = policyTypes.cloned;
			clonedPolicy.render();
			clonedPolicy.addConnections();
		});
	policy.cloneLink = cloneLink;
}

function initNewPolicy() {
	window.policy = {
		'type': policyTypes.new,
		'data': {
			'label': 'New',
			'node': '',
			'parameters': {},
			'input_types': ['any'],
			'output_type': 'any'
		}
	};
}

function gatherUnsetParameters() {
	window.policy.data.parameters = storage.get('Policy', []).reduce((result, policy) => {
		if ([policyTypes.basic, policyTypes.new].includes(policy.type)) return result;
		let parameters = policy.data.parameters || {};
		Object.keys(parameters).forEach(parameter => {
			let p = parameters[parameter];
			if (!p) result[parameter] = p;
		});
		return result;
	}, {});
}

function cleanup() {
	Array.from(storage.get('Policy', [])).forEach(policy => policy.destructor());
}

window.onload = () => {
	let paper = Raphael(0, 0, '100%', '100%');
	let canvasWidth = 800 || paper.canvas.clientWidth;
	let canvasHeight = paper.canvas.clientHeight;
	let etps = paper.rect(canvasWidth - 200, 0, 200, canvasHeight);

	let middle = (canvasWidth - 200) / 2;
	new ConnectionPoint(paper, {x: middle, y: 20}, connectionPointTypes.out, false, true).render();
	paper.text(middle + radius + 5, 20, 'Input').attr('text-anchor', 'start');

	new ConnectionPoint(paper, {x: middle, y: canvasHeight - 20}, connectionPointTypes.in, false, false).render();
	paper.text(middle + radius + 5, canvasHeight - 20, 'Output').attr('text-anchor', 'start');

	paper.image('/images/settings.png', 20, 20, 20, 20)
		.attr('cursor', 'hand')
		.click(() => {
			gatherUnsetParameters();
			new PolicyForm(window.policy, data => {
				window.policy.data = data;
			})
				.render();
		});

	paper.image('/images/save.png', 45, 20, 20, 20)
		.attr('cursor', 'hand')
		.click(() => {
			let policies = storage.get('policies');
			policies.push(clonePolicy(window.policy.data));
			storage.set('policies', policies);
			initNewPolicy();
			cleanup();
			reRenderPolicies();
		});

	storage.set('policies', etp || []);

	window.addEventListener('render_policies', (data) => {
		let policiesRendered = storage.get('policiesRendered', []);
		policiesRendered.forEach(policy => {
			policy.cloneLink.remove();
			policy.destructor();
		});

		policiesRendered = storage.get('policies', []).map((policy, index) => {
			let p = new Policy(paper, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * (policyHeight + 4)}, policy);
			p.type = policy.basic ? policyTypes.basic : policyTypes.new;
			p.render();
			makeCloneLink(paper, p);
			return p;
		});
		storage.set('policiesRendered', policiesRendered);
	});
	reRenderPolicies();

	initNewPolicy();
};
