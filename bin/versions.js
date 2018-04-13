const v = process.versions;

console.log('Currently using :\n');

for (let k in v) {
  console.log(`* ${k} version ${v[k]}`);
}
