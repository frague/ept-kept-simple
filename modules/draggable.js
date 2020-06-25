export class Draggable {
	constructor() {
	}

	startDragging() {
		this.container.toFront();
		this.previousDx = 0;
		this.previousDy = 0;
	}

	move(dx, dy) {
		var tx = dx - this.previousDx;
		var ty = dy - this.previousDy;

		this.container.translate(tx, ty);

		this.previousDx = dx;
		this.previousDy = dy;

		let entity = this.container.entity;
		entity.updatePosition(tx, ty);
	}

	updatePosition(dx, dy) {
		this.position = {x: this.position.x + dx, y: this.position.y + dy};
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
}
