import { storage } from './storage.js';
import { Policy, policyTypes } from './policy.js';
import { buildEptCatalog } from './policy_form.js';

export const validate = () => {
	let catalog = buildEptCatalog();
	Object.entries(catalog).forEach(([ownId, ept]) => {
		let hasErrors = ept.hasErrors;
		let isValid = isEptValid(ept.id || ept.ownId, catalog);
		ept.hasErrors = !isValid;
		if (ept.isRendered) {
			ept.render();
		}
	});
};

export const isEptValid = (ownId, catalog=null, seen={}) => {
	if (seen.hasOwnProperty(ownId)) {
		return seen[ownId];
	}
	if (!catalog) catalog = buildEptCatalog();
	let ept = catalog[ownId];
	if (!ept) throw new Error(`Unable to find the EPT ID=${ownId} for validation`);
	let { asJSON } = ept;
	let result;
	if (ept.type === policyTypes.elementary) {
		result = Object.entries(asJSON.parameters || {}).every(([, value]) => !!value);
	} else {
		result = (asJSON.nodes || []).every(({id, ownId}) => isEptValid(id || ownId, catalog, seen));
	}
	ept.hasErrors = !result;
	seen[ownId] = result;
	return result;
}
