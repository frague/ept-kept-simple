import { etp } from './modules/data.js';
import { Policy, policyHeight } from './modules/policy.js';
import { ConnectionPoint, connectionPointTypes, radius } from './modules/connection_point.js';
import { storage } from './modules/storage.js';

storage.set('connection_points', []);

window.onload = () => {
	let paper = Raphael(0, 0, '100%', '100%');
	let canvasWidth = paper.canvas.clientWidth;
	let etps = paper.rect(canvasWidth - 200, 0, 200, 600);

	etp.forEach((policy, index) => {
		let p = new Policy(paper, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * (policyHeight + 4)}, policy);
		p.render();
	});

	new ConnectionPoint(paper, {x: canvasWidth / 2, y: 20}, connectionPointTypes.out, false, true).render();
	paper.text(canvasWidth / 2 + radius + 15, 20, 'Start');
};
