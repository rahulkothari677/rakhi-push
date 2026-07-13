#!/usr/bin/env python3
"""Replace hardcoded color codes with CSS variable classes in TSX files."""
import re
import sys

# Color mapping: hardcoded hex -> Tailwind CSS variable class
COLOR_MAP = {
    # Primary (burgundy)
    "[#8B1E3E]": "[var(--primary)]",
    "[#8b1e3e]": "[var(--primary)]",
    "[#6B0E2A]": "[var(--primary-dark)]",
    "[#6b0e2a]": "[var(--primary-dark)]",
    "[#A8425B]": "[var(--primary)]",
    # Accent (gold)
    "[#C9A24B]": "[var(--accent)]",
    "[#c9a24b]": "[var(--accent)]",
    "[#B5862D]": "[var(--accent-dark)]",
    "[#b5862d]": "[var(--accent-dark)]",
    "[#E6C373]": "[var(--accent)]",
    "[#e6c373]": "[var(--accent)]",
    # Background (ivory)
    "[#FBF6EC]": "[var(--background)]",
    "[#fbf6ec]": "[var(--background)]",
    "[#F4EAD5]": "[var(--cream)]",
    "[#f4ead5]": "[var(--cream)]",
    # Foreground (dark)
    "[#2A0A0F]": "[var(--foreground)]",
    "[#2a0a0f]": "[var(--foreground)]",
    "[#1A0508]": "[var(--foreground)]",
    "[#1a0508]": "[var(--foreground)]",
    # Muted
    "[#6B5544]": "[var(--muted-foreground)]",
    "[#6b5544]": "[var(--muted-foreground)]",
    # Border
    "[#E8D9B8]": "[var(--border)]",
    "[#e8d9b8]": "[var(--border)]",
}

def replace_colors(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    replacements = 0

    for old, new in COLOR_MAP.items():
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            replacements += count

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filepath}: {replacements} replacements")
    else:
        print(f"⚪ {filepath}: no changes")

if __name__ == "__main__":
    files = [
        "src/components/rakhi/HomeView.tsx",
        "src/components/rakhi/Header.tsx",
        "src/components/rakhi/Footer.tsx",
        "src/components/rakhi/ShopView.tsx",
        "src/components/rakhi/ProductView.tsx",
        "src/components/rakhi/WishlistView.tsx",
        "src/components/rakhi/CartView.tsx",
        "src/components/rakhi/CartDrawer.tsx",
        "src/components/rakhi/InfoPage.tsx",
        "src/components/rakhi/HeroCarousel.tsx",
        "src/components/rakhi/BackButton.tsx",
        "src/components/rakhi/FloatingActions.tsx",
        "src/components/rakhi/AdminLogin.tsx",
    ]

    for f in files:
        try:
            replace_colors(f)
        except FileNotFoundError:
            print(f"⚠️  {f}: file not found")
