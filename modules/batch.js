import { ConnectionPoint, radius } from './connection_point.js';

export class Batch extends ConnectionPoint {
	constructor(paper, position) {
		this.super(paper, position, false);
		this.color = '#0F0';
	}

	clone() {
		return new Batch(this.paper, this.position);
	}

	render() {
	}
}