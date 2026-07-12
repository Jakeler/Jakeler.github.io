from math import exp

r0 = 100_000
t0 = 25 + 273.15
beta = 3950

def res(c): 
    k = c + 273.15
    return r0 * exp(beta * (1/k - 1/t0))

prev = 0
temps = []
for c in range(-100, 350, 1):
    r = res(c)
    temps.append((c, r, r - prev))
    prev = r

print('\n'.join([f'{t[0]}, {t[1]}, {t[2]}' for t in temps]))
