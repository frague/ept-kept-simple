import { etp } from './modules/data.js';
import { Policy, policyHeight } from './modules/policy.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
import { storage } from './modules/storage.js';

storage.set('connection_points', []);

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
		policiesRendfered.forEach(policy => policy.destructor());

		policiesRendfered = storage.get('policies', []).map((policy, index) => {
			let p = new Policy(paper, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * (policyHeight + 4)}, policy);
			p.render();
			return p;
		});
		storage.set('policiesRendered', policiesRendfered);
	});
	let renderPolicies = new CustomEvent('render_policies', {});
	window.dispatchEvent(renderPolicies);

	paper.circle(etps.attrs.x + 10, 400, 10)
		.attr('fill', 'red')
		.click(() => {
			let p = storage.get('policies', []);
			p.push({label: `label${Math.random()}`});
			storage.set('policies', p);

			let renderPolicies = new CustomEvent('render_policies', {});
			window.dispatchEvent(renderPolicies);
		})
};
