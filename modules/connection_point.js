import { Draggable } from './draggable.js';

export class ConnectionPoint extends Draggable {
	isStatic = true;
	color = '000';
	radius = 10;
	link = null;

	constructor(paper, position, isStatic=true) {
		super();
		this.paper = paper;
		this.position = position
		this.isStatic = isStatic;
	}
	
	clone() {
		return new ConnectionPoint(this.paper, this.position, this.isStatic).render();
	}

	startDragging() {
		let source = this.origin.clone();
		let {cx, cy} = source.attrs;
		this.link = {
			source: source,
			destination: this,
			curve: this.paper.path(`M${cx} ${cy}T${this.attrs.cx} ${this.attrs.cy}`)
		};
		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		if (this.link && this.link.curve) {
			let {cx, cy} = this.link.source.attrs;
			let l = Math.sqrt(dx * dx + dy * dy);
			let k = l ? this.origin.radius / l : 1;
			let sx = cx + dx - dx * k;
			let sy = cy + dy - dy * k;
			if (cx != sx || cy != sy) {
				this.link.curve.attr({
					'path': `M${cx} ${cy}T${sx} ${sy}`,
					'arrow-end': 'classic-wide-long',
					'stroke-width': 2
				});
			}
		}
	}

	drop() {
		this.link.curve.remove();
		this.remove();
		delete this.origin;
	}

	render() {
		let circle = this.paper.circle(this.position.x, this.position.y, this.radius)
			.attr({fill: this.color});
		circle.origin = this;
		if (!this.isStatic) {
			this.makeDraggable(circle);
		}
		return circle;
	}
}