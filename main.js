import { etp } from './modules/data.js';
import { Policy, policyHeight, policyWidth } from './modules/policy.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
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
			clonedPolicy.isCloned = true;
			clonedPolicy.wasMoved = true;
			clonedPolicy.render();
			clonedPolicy.addConnections();
		});
	policy.cloneLink = cloneLink;
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

	storage.set('policies', etp || []);

	window.addEventListener('render_policies', (data) => {
		let policiesRendfered = storage.get('policiesRendered', []);
		policiesRendfered.forEach(policy => {
			policy.cloneLink.remove();
			policy.destructor();
		});

		policiesRendfered = storage.get('policies', []).map((policy, index) => {
			let p = new Policy(paper, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * (policyHeight + 4)}, policy);
			p.render();
			makeCloneLink(paper, p);
			return p;
		});
		storage.set('policiesRendered', policiesRendfered);
	});
	reRenderPolicies();
};
