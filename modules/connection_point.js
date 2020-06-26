import { Draggable } from './draggable.js';
import { storage } from './storage.js';
import { Link } from './link.js';

export const radius = 6;

export class ConnectionPoint extends Draggable {
	isStatic = true;
	color = '000';

	connectionCandidate = null;
	circle = null;
	link = null;

	constructor(paper, position, isStatic=true) {
		super();
		this.paper = paper;
		this.position = position
		this.isStatic = isStatic;

		let cp = storage.get('connection_points', []);
		cp.push(this);
		storage.set('connection_points', cp);
	}

	destructor() {
		let cp = storage.get('connection_points', []);
		let i = cp.indexOf(this);
		if (i >= 0) {
			cp.splice(i, 1)
			storage.set('connection_points', cp);
		}
	}
	
	clone() {
		return new ConnectionPoint(this.paper, this.position, this.isStatic);
	}

	startDragging() {
		let origin = this.origin;
		let source = origin.clone();
		source.render();

		console.log(origin.link);
		if (origin.link) {
			origin.link.destructor();
		}
		console.log(source, 111);
		new Link(this.paper, source, origin).render();
		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		this.origin.link.render();
		this.origin.getConnectionCandidate();
		this.attr({
			'fill': origin.connectionCandidate ? '#F00' : '#888'
		});
	}

	getConnectionCandidate() {
		this.connectionCandidate = null;
		let from = this.link.from;
		storage.get('connection_points', []).forEach(cp => {
			if (cp !== this && cp !== from && cp.checkApproach(this.position, 30)) {
				this.connectionCandidate = cp;
			}
		});
	}

	checkApproach(position, threshold, color='#F00') {
		let {dx, dy} = this.circle._;
		dx = this.position.x - position.x;
		dy = this.position.y - position.y;
		let distance = Math.sqrt(dx * dx + dy * dy);
		let isClose = distance <= threshold;
		this.circle.attr({
			'fill': isClose ? color : '#000'
		});
		return isClose;
	}

	drop() {
		let origin = this.origin;
		origin.destructor();

		let cc = origin.connectionCandidate;
		if (cc) {
			let l = new Link(origin.paper, origin.link.from, cc).render();
			l.attr({
				fill: 'red'
			});
			// origin.link.to = cc;
			// cc.link = origin.link;
			cc.color = '#FFF';
			cc.render();
			// origin.link.render();
			// cc.link.from.link = origin.link;
		}
		origin.link.destructor();
		this.remove();
		delete this.origin;
	}

	render() {
		if (!this.circle) {
			this.circle = this.paper.circle(this.position.x, this.position.y, radius);
			this.circle.origin = this;
			if (!this.isStatic) {
				this.makeDraggable(this.circle);
			}
		}
		this.circle.attr({
			'fill': this.color
		});
		if (this.link) {
			this.link.render();
		}
		return this.circle;
	}
}