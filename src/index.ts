import minimist from 'minimist';
import path from 'path';
import init from './init/main';
import resetPassword from './tool/reset-password';
import bootServer from './server/main';
import upgrade3 from './upgrade/v3';

const argv = minimist(process.argv.slice(2));

if (argv._.length < 2 || argv.h || argv.help || argv._[0] === 'help') {
    process.stderr.write('help\n');
    process.exit(1);
}

switch (argv._[0]) {
case 'init': {
    init(path.resolve(process.cwd(), argv._[1]));
    break;
}
case 'reset-password': {
    resetPassword(path.resolve(process.cwd(), argv._[1]));
    break;
}
case 'server': {
    bootServer(path.resolve(process.cwd(), argv._[1]));
    break;
}
case 'upgrade': {
    upgrade3(path.resolve(process.cwd(), argv._[1]));
    break;
}
default: {
    process.stderr.write('help\n');
    process.exit(1);
}
}
