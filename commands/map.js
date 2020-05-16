const fs = require('fs');
const mapFiles = fs.readdirSync('./Data/Map').filter(file => file.endsWith('.pdf'));
const maps = [];

for (const file of mapFiles) {
	const name = file.replace('.pdf', '');
	maps.push(name);
}

module.exports = {
	name: 'map',
	description: 'Returns the map for the specific area from the Campaign',
	usage: `<area name>\nThe following names are usable:\n${maps.join(', ')}`,
	args: true,
	execute: function(message, args) {
		if (codices.includes(args[0])) {
			const bpnEmbed = {
				color: 0x0000FF,
				title: `Map of ${args[0]}`,
				image: {
					url: `./Data/Map/${args[0]}.pdf`,
				},
			};
			message.channel.send({embed: bpnEmbed});
		} else {
			message.channel.send('Henrik, nej!')
		}
	},
};
