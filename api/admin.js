export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (req.headers['x-admin-key'] !== 'finplan2024') return res.status(401).json({ error: 'Unauthorized' })
  const svcKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6enpjYXNuem5wZGlibnNkbGtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIzNjE4MCwiZXhwIjoyMDkyODEyMTgwfQ.dkVSCZElfd36JFlHpH7GGTRspdRIFCveoE2N9QFKAEQ'
  const url = 'https://szzzcasnznpdibnsdlko.supabase.co'
  const h = { 'apikey': svcKey, 'Authorization': 'Bearer ' + svcKey }
  const [p, d] = await Promise.all([
    fetch(url + '/rest/v1/profiles?select=*&order=last_seen.desc', { headers: h }).then(r => r.json()),
    fetch(url + '/rest/v1/financial_data?select=*', { headers: h }).then(r => r.json())
  ])
  return res.status(200).json({ profiles: p, financialData: d })
}
