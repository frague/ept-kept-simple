import { radius } from './connection_point.js';

export class Link {
	constructor(paper, from, to) {
		from.linkWith(this);
		to.linkWith(this);

		this.paper = paper;
		this.from = from;
		this.to = to;
		this.curve = null;
	}

	destructor() {
		if (this.curve) {
			this.curve.remove();
		}
		if (this.from) {
			this.from.unlink(this);
		}
		if (this.to) {
			this.to.unlink(this);
		}
		delete this;
	}

	_calcTo() {
		let {x, y} = this.from.position;
		let dx = this.to.position.x - x;
		let dy = this.to.position.y - y;
		let l = Math.sqrt(dx * dx + dy * dy);
		let k = l ? radius / l : 1;
		let sx = x + dx - dx * k;
		let sy = y + dy - dy * k;
		return ` T ${sx} ${sy}`;
	}

	render() {
		let path = `M ${this.from.position.x} ${this.from.position.y}${this._calcTo()}`;
		if (this.curve) {
			this.curve.attr({ path });
		} else {
			this.curve = this.paper.path(path)
				.attr({
					'arrow-end': 'classic-wide-long',
					'stroke-width': 3
				});
		}
		this.curve.toFront();
		return this.curve;
	}
}