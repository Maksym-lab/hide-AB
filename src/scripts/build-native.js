const { exec } = require('child_process');
const semver = require('semver');
exec('tns --version', (err, stdout, stderr) => {
    if (err) {
        console.log(`tns --version err: ${err}`);
        return;
    }
    const tnsVersion = semver.major((stdout.match(/^(?:\d+\.){2}\d+.*?$/m) || [])[0]);
    if (tnsVersion >= 4) {
        console.log(`executing 'tns plugin build'`);
        exec('tns plugin build', (err, stdout, stderr) => {
            if (err) {
                console.log(`${err}`);
                return;
            }
        });
    }
});
