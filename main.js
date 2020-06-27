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

	etp.forEach((policy, index) => {
		let p = new Policy(paper, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * (policyHeight + 4)}, policy);
		p.render();
	});

	let middle = (canvasWidth - 200) / 2;
	new ConnectionPoint(paper, {x: middle, y: 20}, connectionPointTypes.out, false, true).render();
	paper.text(middle + radius + 5, 20, 'Input').attr({'text-anchor': 'start'});

	new ConnectionPoint(paper, {x: middle, y: canvasHeight - 20}, connectionPointTypes.in, false, false).render();
	paper.text(middle + radius + 5, canvasHeight - 20, 'Output').attr({'text-anchor': 'start'});
};
