export class Policy {
	constructor(paper, data, position) {
		this.paper = paper;
		this.data = data;
		this.position = position
	}

	dragger() {
		this.previousDx = 0;
		this.previousDy = 0;
	}

	move(dx, dy) {
		var txGroup = dx - this.previousDx;
		var tyGroup = dy - this.previousDy;

		this.group.translate(txGroup, tyGroup);

		this.previousDx = dx;
		this.previousDy = dy;
	}

	up() {}

    addToGroup(group, elements) {
    	elements.forEach(element => {
    		element.group = group;
    	});
    	group.push(...elements);
    }

	render() {
		let group = this.paper.set();
		let rect = this.paper.rect(this.position.x, this.position.y, 100, 30).attr({
		    fill: '#EEE',
		    stroke: '#000',
		    cursor: 'move',
		});
		let text = this.paper.text(this.position.x + 20, this.position.y + 10, this.data.name);
		this.addToGroup(group, [rect, text]);
		group.drag(this.move, this.dragger, this.up);
		return group;
	}
}