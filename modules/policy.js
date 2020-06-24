export class Policy {
	wasMoved = false;

	constructor(paper, data, position) {
		this.paper = paper;
		this.data = data;
		this.position = position
	}

	clone() {
		new Policy(this.paper, this.data, this.position).render();
	}

	dragger() {
		if (!this.wasMoved) {
			this.policy.clone();
			this.wasMoved = true;
		}
		this.policy.group.toFront();
		this.previousDx = 0;
		this.previousDy = 0;
	}

	move(dx, dy) {
		var txGroup = dx - this.previousDx;
		var tyGroup = dy - this.previousDy;

		this.policy.group.translate(txGroup, tyGroup);

		this.previousDx = dx;
		this.previousDy = dy;
	}

	up() {}

    addToGroup(group, elements) {
    	elements.forEach(element => {
    		element.policy = this;
    	});
    	group.push(...elements);
    }

	render() {
		this.group = this.paper.set();
		let rect = this.paper.rect(this.position.x, this.position.y, 100, 30).attr({
		    fill: '#EEE',
		    stroke: '#000',
		    cursor: 'move',
		});
		let text = this.paper.text(this.position.x + 20, this.position.y + 10, this.data.name);
		this.addToGroup(this.group, [rect, text]);
		this.group.drag(this.move, this.dragger, this.up);
	}
}