export var etp = [
	{
		'label': 'Subinterface',
		'tags': [],
		'node': '',
		'parameters': {
			'security_zone': '',
			'vlan_id': ''
		},
		'input_types': ['interface'],
		'output_type': 'interface',
		'basic': true,
	},
	{
		'label': 'Attach VLAN',
		'tags': [],
		'node': '',
		'parameters': {
			'vlan_id': ''
		},
		'input_types': ['interface'],
		'output_type': 'interface',
		'basic': true,
	},
	{
		'label': 'Address type',
		'tags': [],
		'node': '',
		'parameters': {
			'IPv4': '',
			'IPv6': ''
		},
		'input_types': ['interface', 'subinterface'],
		'output_type': 'interface',
		'basic': true,
	},
	{
		'label': 'BGP unnumbered',
		'tags': [],
		'node': '',
		'parameters': {},
		'input_types': ['interface', 'subinterface'],
		'output_type': 'interface',
		'basic': true,
	},
	{
		'label': 'Routing policy',
		'tags': [],
		'node': '',
		'parameters': {},
		'input_types': ['any'],
		'output_type': 'interface',
		'basic': true,
	},
]