
// Reconstruct before calculator globals can use either table.
static __attribute__((constructor(101), noinline)) void restore_primes() {
    const unsigned maximum = @MAXIMUM@;
    std::vector<unsigned char> sieve(maximum / 2 + 1);
    for (unsigned n = 3; n * n <= maximum; n += 2) {
        if (sieve[n / 2]) continue;

        for (unsigned mark = n * n; mark <= maximum; mark += 2 * n)
            sieve[mark / 2] = 1;
    }

    unsigned count = 0;
    PRIMES_L[count++] = 2;
    for (unsigned n = 3; n <= maximum; n += 2) {
        if (!sieve[n / 2]) PRIMES_L[count++] = n;
    }
    if (count != sizeof(PRIMES_L) / sizeof(*PRIMES_L)) __builtin_trap();

    unsigned long long value = 0;
    for (unsigned i = 0; i < PRIME_M_COUNT; ++i) {
        unsigned delta = 0;
        for (unsigned lane = 0; lane < 4; ++lane)
            delta |= unsigned(PRIME_DELTAS[lane][i]) << (lane * 8);

        value += i == 0 ? delta : 2ULL * delta;
        PRIME_M[i] = value;
    }
}
