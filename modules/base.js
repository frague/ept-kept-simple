export class Positioned {
	position = {x: 0, y: 0};

	constructor(position) {
		this.position = position;
	}

	updatePosition(dx, dy) {
		this.position = {x: this.position.x + dx, y: this.position.y + dy};
	}
}