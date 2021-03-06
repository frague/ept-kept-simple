import { Positioned } from './base.js';
import { Draggable } from './draggable.js';
import { storage } from './storage.js';
import { Link } from './link.js';
import { className } from './utils.js';

export const radius = 8;
export const connectionPointTypes = { in: 'in', out: 'out' };

export class ConnectionPoint extends Positioned {
	isStatic = true;
	isApproached = false;

	connectionCandidate = null;
	circle = null;
	linker = null;
	typesList = null;
	belongsTo = null;
	isHidden = false;

	constructor(paper, position, type=connectionPointTypes.any, isStatic=false, isMulti=false, types=[]) {
		super(position);
		this.paper = paper;
		this.type = type;	// Type the point gets after linking
		this.isStatic = isStatic;
		this.isMulti = isMulti;
		this.types = types;	// Types this point can accept
	}

	destructor() {
		super.destructor();
		Array.from(this.linkedWith).forEach(entity => entity.destructor());
		delete this;
	}
	
	clone() {
		return new ConnectionPoint(this.paper, this.position, this.type, this.isStatic, this.isMulti);
	}

	onLinkChange() {
		// Custom linking logic
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

	canConnectTo(connectionPoint) {
		if (connectionPoint !== this
			&& !connectionPoint.isHidden
			&& this.type !== connectionPoint.type
			&& (connectionPoint.isMulti || !connectionPoint.isLinked())
			&& (
				this.types.includes('any')
				|| connectionPoint.types.includes('any')
				|| this.types.some(type => connectionPoint.types.includes(type))
			)
		) return true;
		return false;
	}

	_determineClassName() {
		return className({
			'connection-point': true,
			[this.type]: true,
			'approached': this.isApproached,
		});
	}

	render() {
		if (!this.isHidden) {
			if (!this.isRendered) {
				this.group = this.paper.set();
				this.base = this.paper.circle(this.position.x, this.position.y, radius);

				this.typesList = this.paper.text(
					this.position.x + radius + 6,
					this.position.y + (this.type === connectionPointTypes.out ? 8 : -10),
					this.types.join(', '),
				);
				this.group.push(this.base, this.typesList);

				if (!this.isStatic) {
					this.linker = new Linker(this.paper, this.position, this);
					this.group.push(this.linker.render());
				}
			}
			this.base.node.setAttribute('class', this._determineClassName());
			this.typesList.attr({
				'text': this.types.join(', '),
				'text-anchor': 'start'
			});
		}

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
		storage.get(ConnectionPoint.name, []).forEach(connectionPoint => {
			if (this.starter.canConnectTo(connectionPoint) && connectionPoint.checkApproach(this.position, 50)) {
				this.connectionCandidate = connectionPoint;
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
			entity.starter.onLinkChange();
			connection.onLinkChange();
			connection.isApproached = false;
			connection.render();
		}

		let {x, y} = entity.position;
		this.translate(this.oldX - x, this.oldY - y);
		entity.position = entity.starter.position;
		entity.render();
	}

	onLinkChange() {}

	_determineClassName() {
		return className({
			'linker': true,
			[this.type]: true
		});
	}

	render() {
		if (!this.isRendered) {
			this.circle = this.paper.circle(this.position.x, this.position.y, radius - 2);
			this.circle.node.setAttribute('class', this._determineClassName());
			this.circle.toFront();	
			this.makeDraggable(this.circle);
		}
		super.render();
		return this.circle;
	}
}