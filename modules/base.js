export class Positioned {
	position = {x: 0, y: 0};
	wasTouched = false;
	linkedWith = [];

	constructor(position) {
		this.position = position;
	}

	linkWith(entity) {
		let index = this.linkedWith.indexOf(entity);
		if (index < 0) this.linkedWith.push(entity);
	}

	unlink(entity) {
		let index = this.linkedWith.indexOf(entity);
		if (index >= 0) this.linkedWith.splice(index, 1);
	}

	updatePosition(dx, dy) {
		this.position = {x: this.position.x + dx, y: this.position.y + dy};
	}

	render() {
		this.wasTouched = true;
		this.linkedWith.forEach(entity => entity.render());
	}
}