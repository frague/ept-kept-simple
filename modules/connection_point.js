import { Draggable } from './draggable.js';
import { storage } from './storage.js';
import { Link } from './link.js';

export const radius = 6;
export const connectionPointTypes = {
	'any': '#FFF',
	'in': '#0F0',
	'out': '#F00'
};

export class ConnectionPoint extends Draggable {
	isStatic = true;
	isApproached = false;

	connectionCandidate = null;
	circle = null;
	link = null;

	constructor(paper, position, type=connectionPointTypes.any, isStatic=false, isMulti=false) {
		super(position);
		this.paper = paper;
		this.type = type;
		this.isStatic = isStatic;
		this.isMulti = isMulti;

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
		this.linkedWith.forEach(entity => entity.destructor());
		delete this;
	}
	
	clone() {
		return new ConnectionPoint(this.paper, this.position, this.type, this.isStatic, this.isMulti);
	}

	startDragging() {
		let origin = this.origin;
		if (!origin.isMulti) {
			origin.linkedWith.forEach(entity => {
				if (entity instanceof Link) {
					entity.destructor();
				}
			});
		}

		this.start = origin.clone();
		this.start.render();

		let isOutgoing = this.type != connectionPointTypes.in;
		new Link(this.paper, isOutgoing ? this.start : origin, isOutgoing ? origin : this.start).render();
		
		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		this.origin.getConnectionCandidate();
	}

	getConnectionCandidate() {
		this.connectionCandidate = null;
		storage.get('connection_points', []).forEach(cp => {
			if (cp !== this && this.type !== cp.type && cp.checkApproach(this.position, 30)) {
				this.connectionCandidate = cp;
			}
		});
	}

	checkApproach(position, threshold) {
		let {dx, dy} = this.circle._;
		dx = this.position.x - position.x;
		dy = this.position.y - position.y;
		let distance = Math.sqrt(dx * dx + dy * dy);
		let isClose = distance <= threshold;
		this.isApproached = isClose;
		this.render();
		return isClose;
	}

	drop() {
		let origin = this.origin;

		let connection = origin.connectionCandidate;
		if (connection) {
			let isIncoming = connection.type === connectionPointTypes.in;
			new Link(origin.paper, isIncoming ? this.start : connection, isIncoming ? connection : this.start).render();
			connection.isApproached = false;
			connection.render();
		}

		this.remove();
		origin.destructor();
	}

	_getColor() {
		return this.type;
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
			'stroke': this.isApproached ? 'orange' : '#000',
			'stroke-width': this.isApproached ? 2 : 1,
			'fill': this._getColor()
		});

		if (this.link) {
			this.link.render();
		}
		super.render();
		return this.circle;
	}
}