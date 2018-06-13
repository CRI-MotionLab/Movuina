const v = process.versions;

console.log('Electron currently using :\n');

for (let k in v) {
  console.log(`* ${k} version ${v[k]}`);
}

process.exit(1);
