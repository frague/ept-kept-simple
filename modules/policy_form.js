import { clonePolicy, policyTypes } from './policy.js';

const placeholder = document.getElementById('forms');

export class PolicyForm {
	constructor(policy, callback=() => {}) {
		this.callback = callback;

		this.policy = policy;
		this.data = clonePolicy(policy.data);
	}

	_clear() {
		placeholder.innerHTML = '';
	}

	_updateParameter(input) {
		let {name, value} = input;
		this.data.parameters[name] = value;
	}

	_appendInput(name, value) {
		let div = document.createElement('div')

		let label = document.createElement('label');
		label.htmlFor = name;
		label.innerText = name;

		let input = document.createElement('input');
		input.id = name;
		input.name = name;
		input.value = value;
		input.onchange = () => this._updateParameter(input);
		if (value && ![policyTypes.cloned, policyTypes.new].includes(this.policy.type)) {
			input.setAttribute('disabled', 'true');
		}

		label.appendChild(input);
		div.appendChild(label);

		placeholder.appendChild(div);
	}

	render() {
		if (!placeholder) return;
		this._clear();

		if ([policyTypes.reference, policyTypes.basic].includes(this.policy.type)) {
			let title = document.createElement('h1');
			title.innerText = this.data.label;
			placeholder.appendChild(title);
		} else {
			let title = document.createElement('input');
			title.id = 'label';
			title.value = this.data.label;
			title.onchange = () => this.data.label = title.value;
			placeholder.appendChild(title);
		}

		Object.keys(this.data.parameters || {}).forEach(name => this._appendInput(name, this.data.parameters[name]));

		let commitButton = document.createElement('button');
		commitButton.innerText = 'Commit Changes';
		commitButton.onclick = () => this.callback(clonePolicy(this.data));
		placeholder.appendChild(commitButton);
	}
}