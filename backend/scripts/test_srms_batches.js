async function run() {
  const r1 = await fetch('http://localhost:3001/api/srms/batches?colgcd=1&coursecd=1&tenant=srms-cet-bareilly');
  const j1 = await r1.json();
  console.log('SRMS batches for Course 1 (B.Tech):', j1);
}
run().catch(console.error);
