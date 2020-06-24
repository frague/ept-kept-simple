import { etp } from './modules/data.js';
import { Policy } from './modules/policy.js';
import { link } from './modules/link.js';

window.onload = function() {
	Raphael.fn.link = link;
	
	let paper = Raphael(0, 0, '100%', '100%');
	let canvasWidth = paper.canvas.clientWidth;
	let etps = paper.rect(canvasWidth - 200, 0, 200, 600);

	etp.forEach((policy, index) => {
		let p = new Policy(paper, policy, {x: etps.attrs.x + 10, y: etps.attrs.y + 10 + index * 34});
		p.render();
	});
};
