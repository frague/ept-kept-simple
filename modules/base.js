import { storage } from './storage.js';

export class Positioned {
	position = {x: 0, y: 0};
	wasTouched = false;
	linkedWith = [];

	constructor(position) {
		this.position = position;
		let className = this.constructor.name;

		let instances = storage.get(className, []);
		instances.push(this);
		storage.set(className, instances);
	}

	destructor() {
		let className = this.constructor.name;
		let instances = storage.get(className, []);
		let i = instances.indexOf(this);
		if (i >= 0) {
			instances.splice(i, 1)
			storage.set(className, instances);
		}
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