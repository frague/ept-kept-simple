export var basic_epts = [
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
	},
	{
		'label': 'BGP unnumbered',
		'tags': [],
		'node': '',
		'parameters': {},
		'input_types': ['interface', 'subinterface'],
		'output_type': 'interface',
	},
	{
		'label': 'Routing policy',
		'tags': [],
		'node': '',
		'parameters': {},
		'input_types': ['any'],
		'output_type': 'interface',
	},
]