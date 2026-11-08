import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
source = path.read_text()


def table(name):
    body = re.search(r'\b' + name + r'\[\] = \{(.*?)\};', source, re.S).group(1)
    return list(map(int, re.findall(r'\d+', body)))


primes = table('PRIMES_L')
sparse = table('PRIME_M')
maximum = primes[-1]
sieve = bytearray(maximum + 1)
for n in range(2, int(maximum ** 0.5) + 1):
    if not sieve[n]:
        sieve[n * n::n] = bytes([1]) * len(sieve[n * n::n])
assert primes == [n for n in range(2, maximum + 1) if not sieve[n]]

# Halve the even gaps, then group byte lanes for compression.
deltas = [sparse[0]] + [(b - a) // 2 for a, b in zip(sparse, sparse[1:])]
assert all((b - a) % 2 == 0 for a, b in zip(sparse, sparse[1:]))
raw = b''.join(n.to_bytes(4, 'little') for n in deltas)
lanes = ',\n'.join('{' + ','.join(map(str, raw[lane::4])) + '}' for lane in range(4))
# The dense initializer has extra entries beyond its advertised lookup limit.
limits = '\n'.join(re.findall(r'^#define .*', source, re.M))
header = f'''#include <vector>
{limits}
static long int PRIMES_L[{len(primes)}];
static long long int PRIME_M[PRIME_M_COUNT];
static const unsigned char PRIME_DELTAS[4][PRIME_M_COUNT] = {{{lanes}}};
'''
code = pathlib.Path(sys.argv[2]).read_text().replace('@MAXIMUM@', str(maximum))
path.write_text(header + code)
