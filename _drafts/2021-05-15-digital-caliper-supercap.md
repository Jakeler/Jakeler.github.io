---
layout: post
title: "Digital Caliper SuperCap Mod with USB"
tags: electronics mod
---

Diode: 1n4148 https://www.vishay.com/docs/81857/1n4148.pdf
Nominal forward voltage 1V, about 0.8V at low currents, max 300 mA
Leakage of a few nA

https://viereck.ch/latex-to-svg/
```latex
\begin{array}{c}
U_{in} =  5\,V; \; U_{target} =   1.6\,V \\
Diode\ V_F = 0.8 \,V \\
U_{divider} = 1.6\,V  +  0.8 \,V = 2.4 \,V \\
Factor =\frac{2.4}{5} = \frac{12}{25} = 0.48 \\
\\

R_{P_1} = \frac{U^2}{P} = \frac{5^2}{1W} = 25 \,\Omega \\
R_{P_2} = \frac{U^2}{P} = \frac{1.6^2}{1W} = 2.56 \,\Omega \\
R_{I} = \frac{U}{I} = \frac{5V}{0.5A} = 10  \,\Omega \\
\\

R_1 = 15\,\Omega \\
R_2 = 1 \div (2\cdot\frac{1}{51\,\Omega} + \frac{1}{43\,\Omega}) = 16\,\Omega \\
U = \frac{R_1}{R_1+R_2} \cdot U_{in} = \frac{15\,\Omega}{15\,\Omega + 16\,\Omega} \cdot 5\,V = 2.42\,V \\
\\
I_{idle} = \frac{U}{R} = \frac{5V}{15 + 16 \,\Omega} = 161 \,mA \\
I_{max} = \frac{U}{R} = \frac{5V}{16 \,\Omega} = 312 \,mA \\
\end{array}
```

<!-- ```latex
\begin{array}{c}
Factor =\frac{2.4}{5} = \frac{12}{25} = 0.48 \\
\\
\frac{12}{25} = \frac{x}{x+y} \\
\frac{12}{25} - \frac{x}{x+y} = 0  \\
\frac{12(x+y) - 25x}{25(x+y)} = 0 \\
\frac{-13x+12y}{25x+25y} = 0 \\
\\
-13x+12y \to 0 \\
13x = 12y \\
x = \frac{12}{13}y
\end{array}
``` 
-->

```latex
\begin{array}{c}
Factor = k = 0.48 \\
\\
k = \frac{y}{y+x} \\
k (y+x) = y \\
ky+kx = y \\
kx = y - ky \\
x = \frac{y}{k} - y \\
\\
x =  \frac{1-k}{k}y \\
\frac{1-0,48}{0,48} \cdot 15 \,\Omega = 16.25 \,\Omega
\end{array}
```