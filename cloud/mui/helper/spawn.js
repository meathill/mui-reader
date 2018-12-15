const spawn = require('child_process').spawn;

module.exports = function (cmd, args) {
  const process = spawn(cmd, args);
  process.stdout.on('data', console.log);
  process.stderr.on('data', console.error);
  return new Promise((resolve) => {
    process.on('close', resolve);
  });
};
