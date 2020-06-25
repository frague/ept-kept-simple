export class Draggable {
	constructor() {
	}

	startDragging() {
		this.container.toFront();
		this.previousDx = 0;
		this.previousDy = 0;
	}

	move(dx, dy) {
		var txGroup = dx - this.previousDx;
		var tyGroup = dy - this.previousDy;

		this.container.translate(txGroup, tyGroup);

		this.previousDx = dx;
		this.previousDy = dy;
	}

	drop() {}

	makeDraggable(element, siblings=[]) {
		[element, ...siblings].forEach(el => {
			el.container = element;
			el.attr({cursor: 'move'});
		});
		element.drag(this.move, this.startDragging, this.drop);
	}
}
