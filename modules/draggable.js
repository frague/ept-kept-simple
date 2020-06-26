import { Positioned } from './base.js';

export class Draggable extends Positioned {
	linkedWith = [];

	constructor(position) {
		super(position);
	}

	startDragging() {
		this.container.toFront();
		this.previousDx = 0;
		this.previousDy = 0;
	}

	linkWith(entity) {
		let index = this.linkedWith.indexOf(entity);
		if (index < 0) this.linkedWith.push(entity);
	}

	unlink(entity) {
		let index = this.linkedWith.indexOf(entity);
		if (index >= 0) this.linkedWith.splice(index, 1);
	}

	move(dx, dy) {
		var tx = dx - this.previousDx;
		var ty = dy - this.previousDy;

		this.container.translate(tx, ty);

		this.previousDx = dx;
		this.previousDy = dy;

		let entity = this.container.entity;
		entity.updatePosition(tx, ty);

		entity.linkedWith.forEach(entity => entity.render());
	}

	drop() {}

	makeDraggable(element, siblings=[]) {
		[element, ...siblings].forEach(el => {
			el.container = element;
			el.attr({
				'cursor': 'move'
			});
		});
		element.entity = this;
		element.drag(this.move, this.startDragging, this.drop);
	}

	render() {
		this.linkedWith.forEach(entity => entity.render());
	}
}
