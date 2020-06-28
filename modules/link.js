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

	_calcPath() {
		let {x, y} = this.from.position;
		let dx = this.to.position.x - x;
		let dy = this.to.position.y - y;
		let l = Math.sqrt(dx * dx + dy * dy);
		
		let ry = dy * (l ? radius / l : 1);
		let ty = dy / 3;
		let [sx, sy] = [x + dx, y + dy - ry];

		return `M${x},${y + ry}C${x},${y + ty + ry},${sx},${sy - ty},${sx},${sy}`;
	}

	render() {
		if (!this.curve) {
			let curve = this.paper.path(this._calcPath());
			curve
				.mouseover(() => {
					curve.attr('stroke', 'red');
				})
				.mouseout(() => {
					curve.attr('stroke', '#000');
				})
				.click(() => {
					this.destructor();
				})
			this.curve = curve;
		}
		this.curve.attr({
			'path': this._calcPath(),
			'stroke-width': 2,
			'arrow-end': 'classic-wide-long'
		});
		this.curve.toFront();
		return this.curve;
	}
}