import { storage } from './storage.js';
import { Policy, policyHeight, policyWidth } from './policy.js';
import { Link } from './link.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';

export class Positioner {
	starts;
	ends;
	positions = [];
	
	init() {
		this.starts = [];
		this.ends = [];
		storage.get(ConnectionPoint.name, []).forEach(point => 
			(point.type === connectionPointTypes.in ? this.ends : this.starts).push(point)
		);
		this.positions = storage.get(Policy.name, [])
			.filter(ept => ept.isRendered)
			.map(ept => ({...ept.position, ownId: ept.ownId}));
	}

	addLink(ept) {
		let connectionCandidates = this.starts
			// Filter out impossible connections
			.filter(point => point.canConnectTo(ept.input))
			// Sort possible ones by relevance
			.sort((point1, point2) => {
				return (point1.belongsTo || 'ID0') > (point2.belongsTo || 'ID0') ? -1 : 1;
			});

		// Connect to the most relevant candidate if there are any
		if (connectionCandidates.length) {
			new Link(ept.paper, connectionCandidates[0], ept.input).render();
			return connectionCandidates[0];
		}
		return null;
	}

	_isPositionOverlapping(position, eptOwnId) {
		return this.positions.some(({x, y, ownId}) => {
			return ownId !== eptOwnId
				&& Math.abs(x - position.x) < policyWidth
				&& Math.abs(y - position.y) < policyHeight;
		});
	}

	_tryPlacingTo(position, ept) {
		if (!this._isPositionOverlapping(position, ept.ownId)) {
			ept.startDragging();
			ept.move(position.x - ept.position.x, position.y - ept.position.y);
			ept.drop();
			ept.render();
			return true;
		}
		return false;
	}

	position(ept) {
		this.init();

		let maxY = Math.max(...this.positions.map(p => p.y), 20);
		ept.position = {x: 230, y: maxY + policyHeight + 65};
		ept.render();

		let connectedTo = this.addLink(ept);
		if (connectedTo) {
			for (let ky = 1; ky < 2; ky++) {
				for (let kx = 0; kx < 200; kx+=20) {
					if (
						this._tryPlacingTo({x: 230 + kx, y: connectedTo.position.y + (policyHeight + 30) * ky}, ept)
						|| this._tryPlacingTo({x: 230 - kx, y: connectedTo.position.y + (policyHeight + 30) * ky}, ept)
					) return;
				}
			}
		};

		return ept;
	}
}