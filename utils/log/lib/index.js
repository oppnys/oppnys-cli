const log = require('npmlog');

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
log.heading = 'oppnys';
log.headingStyle = { fg: 'red', bg: 'white' };
log.addLevel('success', 2000, { fg: 'green', bold: true });

module.exports = log;
