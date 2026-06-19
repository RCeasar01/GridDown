const { execSync } = require('child_process');

const opts = {
  cwd: 'E:/Projects/GridDown',
  encoding: 'utf8',
  stdio: 'pipe',
};

function run(cmd) {
  try {
    const out = execSync(cmd, { ...opts, timeout: 30000 });
    if (out.trim()) console.log(out.trim());
  } catch (e) {
    const err = e.stderr || e.stdout || e.message;
    if (err.trim()) console.log('STDERR:', err.trim());
  }
}

console.log('Initializing git repo...');
run('git init -b main');
run('git config user.email "vqpy2kbmnc@privaterelay.appleid.com"');
run('git config user.name "RCeasar01"');
run('git remote add origin https://github.com/RCeasar01/GridDown.git');
console.log('Git initialized and remote added.');
