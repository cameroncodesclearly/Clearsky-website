# Run from the repo root: python3 scripts/make-grain.py (needs numpy and Pillow).
# Portra-400-style grain tile: clumped, multi-scale, mostly luminance with a
# faint chroma component, seamless (generated with wrap-around filters).
import numpy as np
from PIL import Image
def gaussian_filter(a, sigma, mode='wrap'):
    # circular (seamless) gaussian blur via FFT
    fy = np.fft.fftfreq(a.shape[0])[:, None]; fx = np.fft.fftfreq(a.shape[1])[None, :]
    k = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * k))
rng = np.random.default_rng(400)
N = 512
def layer(sigma, amp):
    n = rng.standard_normal((N, N))
    return gaussian_filter(n, sigma, mode='wrap') * amp / (gaussian_filter(rng.standard_normal((N,N)), sigma, mode='wrap').std() + 1e-9)
# fine silver grain + a softer clump layer + very soft mottling
lum = layer(0.55, 1.0) + layer(1.1, 0.55) + layer(2.6, 0.18)
# grain is irregular: weight by a slowly varying "emulsion density"
dens = 0.8 + 0.35 * gaussian_filter(rng.standard_normal((N, N)), 18, mode='wrap') / 0.02
dens = np.clip(0.75 + 0.25 * (dens - dens.mean()) / dens.std(), 0.45, 1.15)
lum = lum * dens
lum = (lum - lum.mean()) / lum.std()
chroma = [layer(0.9, 1.0) for _ in range(3)]
chroma = [(c - c.mean()) / c.std() for c in chroma]
rgb = np.stack([lum + 0.22 * chroma[0], lum + 0.16 * chroma[1], lum + 0.26 * chroma[2]], -1)
img = np.clip(128 + rgb * 34, 0, 255).astype(np.uint8)
print(img.mean(), img.std())

# Transparent version used on the site: light and dark specks on clear, so the
# overlay needs no blend mode (much cheaper to composite while scrolling).
v = img.astype(np.float32).mean(-1)
dev = (v - 128) / 128
alpha = np.clip(np.abs(dev) * 1.6, 0, 1)
base = np.where(dev[..., None] > 0, 255.0, 0.0)
chroma = (img.astype(np.float32) - v[..., None]) * 2.5
rgba = np.concatenate([np.clip(base + chroma, 0, 255), alpha[..., None] * 255], -1).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save('public/sky/grain-alpha.webp', quality=72, alpha_quality=70, method=6)
