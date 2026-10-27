// Run with CHECKLY_API_KEY, CHECKLY_ACCOUNT_ID, MONITORING_SECRET and ALERT_EMAIL.
const base = 'https://hamburgueria-prime.vercel.app';
async function api(path, options = {}) {
  const response = await fetch(`https://api.checklyhq.com/v1${path}`, {
    ...options, headers: { Authorization: `Bearer ${process.env.CHECKLY_API_KEY}`, 'X-Checkly-Account': process.env.CHECKLY_ACCOUNT_ID,
      'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Checkly ${response.status}: ${data.message ?? 'request failed'}`);
  return data;
}
async function main() {
  if (!process.env.CHECKLY_API_KEY || !process.env.CHECKLY_ACCOUNT_ID || !process.env.MONITORING_SECRET || !process.env.ALERT_EMAIL) throw Error('Missing monitoring configuration');
  const variables = await api('/variables');
  const variable = { key: 'HP_MONITORING_AUTH', value: `Bearer ${process.env.MONITORING_SECRET}`, locked: true, secret: true };
  // API checks resolve account variables; per-check variables only apply to browser checks.
  const variableExists = variables.some(item => item.key === variable.key);
  await api(variableExists ? `/variables/${variable.key}` : '/variables', { method: variableExists ? 'PUT' : 'POST', body: JSON.stringify(variableExists ? { value: variable.value, locked: true, secret: true } : variable) });
  const channels = await api('/alert-channels');
  let channel = channels.find(item => item.type === 'EMAIL' && item.config.address === process.env.ALERT_EMAIL);
  if (!channel) channel = await api('/alert-channels', { method: 'POST', body: JSON.stringify({ type: 'EMAIL', config: { address: process.env.ALERT_EMAIL }, sendFailure: true, sendRecovery: true, sendDegraded: false, autoSubscribe: false }) });
  const existing = await api('/checks');
  const targets = [
    { name: 'Hamburgueria Prime - site', path: '/cardapio' },
    { name: 'Hamburgueria Prime - banco', path: '/api/health' },
    { name: 'Hamburgueria Prime - backup diario', path: '/api/health/backup', backup: true },
  ];
  for (const target of targets) {
    const definition = {
      name: target.name, checkType: 'API', activated: !process.argv.includes('--disabled'), muted: false, frequency: 15,
      locations: ['us-east-1'], runParallel: false, doubleCheck: true, tags: ['hamburgueria-prime', 'production'],
      useGlobalAlertSettings: false,
      alertSettings: { escalationType: 'RUN_BASED', runBasedEscalation: { failedRunThreshold: 2 }, reminders: { amount: 0, interval: 5 }, parallelRunFailureThreshold: { enabled: false, percentage: 10 } },
      alertChannelSubscriptions: [{ alertChannelId: channel.id, activated: true }],
      request: { url: base + target.path, method: 'GET', followRedirects: true, skipSSL: false,
        headers: target.backup ? [{ key: 'Authorization', value: '{{HP_MONITORING_AUTH}}' }] : [],
        assertions: [{ source: 'STATUS_CODE', comparison: 'EQUALS', target: '200', property: '' }] },
    };
    // Keep the read-only credential in Checkly's locked account environment, never in the source definition.
    const old = existing.find(check => check.name === target.name);
    const created = await api(old ? `/checks/api/${old.id}` : '/checks/api', { method: old ? 'PUT' : 'POST', body: JSON.stringify(definition) });
    console.log(JSON.stringify({ name: target.name, id: created.id, activated: created.activated, frequencyMinutes: created.frequency, emailAlerts: true }));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
