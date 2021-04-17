const Command = require('@oppnys/command');

class InitCommand extends Command {

}

function init(argv) {
  return new InitCommand(argv);
}

module.exports.InitCommand = InitCommand;
module.exports = init;
