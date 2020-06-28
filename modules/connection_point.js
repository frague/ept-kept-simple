import { Positioned } from './base.js';
import { Draggable } from './draggable.js';
import { storage } from './storage.js';
import { Link } from './link.js';

export const radius = 6;
export const connectionPointTypes = {
	'in': '#0F0',
	'out': '#F00'
};

export class ConnectionPoint extends Positioned {
	isStatic = true;
	isApproached = false;

	connectionCandidate = null;
	circle = null;
	linker = null;

	constructor(paper, position, type=connectionPointTypes.any, isStatic=false, isMulti=false) {
		super(position);
		this.paper = paper;
		this.type = type;
		this.isStatic = isStatic;
		this.isMulti = isMulti;
	}

	destructor() {
		super.destructor();
		Array.from(this.linkedWith).forEach(entity => entity.destructor());
		delete this;
	}
	
	clone() {
		return new ConnectionPoint(this.paper, this.position, this.type, this.isStatic, this.isMulti);
	}

	checkApproach(position, threshold) {
		let {x, y} = this.position;
		let dx = x - position.x;
		let dy = y - position.y;
		let distance = Math.sqrt(dx * dx + dy * dy);
		let isClose = distance <= threshold;
		this.isApproached = isClose;
		this.render();
		return isClose;
	}

	isLinked() {
		return this.linkedWith.some(entity => entity instanceof Link);
	}

	_getColor() {
		return this.type;
	}

	updatePosition(dx, dy) {
		super.updatePosition(dx, dy);
		if (this.linker) {
			this.linker.updatePosition(dx, dy);
		}
	}

	render() {
		if (!this.wasTouched) {
			this.group = this.paper.set();
			this.base = this.paper.circle(this.position.x, this.position.y, radius)
				.attr({
					fill: '#888'
				});
			this.group.push(this.base);
			if (!this.isStatic) {
				this.linker = new Linker(this.paper, this.position, this);
				this.group.push(this.linker.render());
			}
		}
		this.base.attr({
			'stroke': this.isApproached ? 'orange' : '#000',
			'stroke-width': this.isApproached ? 2 : 1,
			'fill': this._getColor()
		});

		super.render();
		return this.group;
	}
}

class Linker extends Draggable {
	constructor(paper, position, starter) {
		super(position);
		this.paper = paper;
		this.starter = starter;
	}

	startDragging() {
		let starter = this.entity.starter;
		if (!starter.isMulti) {
			starter.linkedWith.forEach(entity => {
				if (entity instanceof Link) {
					entity.destructor();
				}
			});
		}

		let isOutgoing = starter.type != connectionPointTypes.in;
		this.tempLink = new Link(this.paper, isOutgoing ? starter : this.entity, isOutgoing ? this.entity : starter);
		this.tempLink.render().attr({stroke: '#888'});

		this.oldX = this.entity.position.x;
		this.oldY = this.entity.position.y;

		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		this.entity.getConnectionCandidate();
	}

	getConnectionCandidate() {
		this.connectionCandidate = null;
		storage.get(ConnectionPoint.name, []).forEach(cp => {
			if (cp !== this.starter
				&& this.starter.type !== cp.type
				&& !cp.isLinked()
				&& cp.checkApproach(this.position, 30)
			) {
				this.connectionCandidate = cp;
			}
		});
	}

	drop() {
		let entity = this.entity;
		this.tempLink.destructor();

		let connection = entity.connectionCandidate;
		if (connection) {
			let isIncoming = connection.type === connectionPointTypes.in;
			new Link(entity.paper, isIncoming ? entity.starter : connection, isIncoming ? connection : entity.starter).render();
			connection.isApproached = false;
			connection.render();
		}

		let {x, y} = entity.position;
		this.translate(this.oldX - x, this.oldY - y);
		entity.position = entity.starter.position;
		entity.render();
	}

	render() {
		if (!this.wasTouched) {
			this.circle = this.paper.circle(this.position.x, this.position.y, radius - 2)
				.attr({
					fill: 'rgba(0,0,0,0.5)'
				});
			this.circle.toFront();	
			this.makeDraggable(this.circle);
		}
		super.render();
		return this.circle;
	}
}