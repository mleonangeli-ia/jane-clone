import { lookup } from 'node:dns/promises';
import { BlockList } from 'node:net';

const MAX_ENDPOINT_LENGTH = 2_048;

// Push service domains operated by the major browser vendors.
const ALLOWED_PUSH_DOMAINS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
] as const;

type ResolvedAddress = { address: string; family: number };
type ResolveHostname = (hostname: string) => Promise<ResolvedAddress[]>;

const blockedNetworks = new BlockList();

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedNetworks.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedNetworks.addSubnet(network, prefix, 'ipv6');
}

function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_PUSH_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

export function validatePushEndpoint(endpoint: unknown): URL | null {
  if (typeof endpoint !== 'string' || endpoint.length === 0 || endpoint.length > MAX_ENDPOINT_LENGTH) {
    return null;
  }

  try {
    const url = new URL(endpoint);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      !isAllowedHostname(url.hostname)
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function resolvePublicAddresses(hostname: string): Promise<ResolvedAddress[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

export async function assertSafePushEndpoint(
  endpoint: unknown,
  resolveHostname: ResolveHostname = resolvePublicAddresses,
): Promise<URL> {
  const url = validatePushEndpoint(endpoint);
  if (!url) throw new Error('Invalid push endpoint');

  const addresses = await resolveHostname(url.hostname);
  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) => {
      if (family !== 4 && family !== 6) return true;
      // Reject IPv4-mapped IPv6 values rather than risk bypassing IPv4 rules.
      if (family === 6 && address.toLowerCase().startsWith('::ffff:')) return true;
      return blockedNetworks.check(address, family === 4 ? 'ipv4' : 'ipv6');
    })
  ) {
    throw new Error('Push endpoint resolved to a blocked network');
  }

  return url;
}
