import os
from PIL import Image, ImageDraw, ImageFont

def create_flock_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base Squircle / Rounded Rect with gradient
    # Deep royal blue to rich navy gradient
    for y in range(size):
        r = int(13 + (27 - 13) * (y / size))
        g = int(31 + (66 - 31) * (y / size))
        b = int(92 + (152 - 92) * (y / size))
        # Draw horizontal lines clipped to rounded rect
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Mask to smooth rounded rect (squircle)
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(8, 8), (size - 8, size - 8)], radius=110, fill=255)
    
    # Apply mask
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    icon.paste(img, (0, 0), mask)
    draw = ImageDraw.Draw(icon)

    # 2. Golden / Emerald concentric decorative ring
    draw.arc([(30, 30), (size - 30, size - 30)], start=0, end=360, fill=(52, 211, 153, 140), width=4)
    draw.arc([(40, 40), (size - 40, size - 40)], start=0, end=360, fill=(245, 158, 11, 100), width=2)

    # 3. Soft glow in the center
    for r in range(160, 20, -10):
        alpha = int(45 * (1 - r / 160))
        draw.ellipse([(size//2 - r, size//2 - r), (size//2 + r, size//2 + r)], fill=(245, 184, 61, alpha))

    # 4. Central Rooster / Poultry illustration
    cx, cy = size // 2, size // 2 - 15

    # Golden Egg at bottom right
    egg_bbox = [(cx + 25, cy + 50), (cx + 125, cy + 175)]
    draw.ellipse(egg_bbox, fill=(245, 158, 11, 255), outline=(254, 243, 199, 255), width=3)
    # Egg shine
    draw.arc([(cx + 45, cy + 65), (cx + 90, cy + 125)], start=200, end=290, fill=(255, 255, 255, 180), width=5)

    # Chicken Body (pure white silhouette with soft shadow)
    # Body oval
    draw.ellipse([(cx - 130, cy - 20), (cx + 50, cy + 140)], fill=(255, 255, 255, 255))
    # Wing detail
    draw.arc([(cx - 110, cy + 10), (cx - 10, cy + 110)], start=30, end=170, fill=(203, 213, 225, 255), width=6)
    draw.arc([(cx - 95, cy + 30), (cx - 20, cy + 120)], start=40, end=160, fill=(203, 213, 225, 255), width=5)

    # Chicken Neck & Head
    draw.polygon([
        (cx - 50, cy + 20),
        (cx - 30, cy - 90),
        (cx + 20, cy - 90),
        (cx + 40, cy + 20)
    ], fill=(255, 255, 255, 255))
    # Head circle
    draw.ellipse([(cx - 40, cy - 130), (cx + 35, cy - 55)], fill=(255, 255, 255, 255))

    # Comb (red crest on top)
    comb_color = (225, 29, 72, 255) # #E11D48
    draw.ellipse([(cx - 35, cy - 160), (cx - 10, cy - 115)], fill=comb_color)
    draw.ellipse([(cx - 12, cy - 175), (cx + 18, cy - 120)], fill=comb_color)
    draw.ellipse([(cx + 12, cy - 165), (cx + 38, cy - 115)], fill=comb_color)

    # Wattle (red chin flap)
    draw.ellipse([(cx + 5, cy - 60), (cx + 25, cy - 30)], fill=comb_color)

    # Beak (golden orange triangle)
    draw.polygon([
        (cx + 30, cy - 95),
        (cx + 70, cy - 80),
        (cx + 30, cy - 70)
    ], fill=(245, 158, 11, 255))

    # Eye
    draw.ellipse([(cx + 8, cy - 100), (cx + 20, cy - 88)], fill=(15, 23, 42, 255))
    draw.ellipse([(cx + 14, cy - 97), (cx + 18, cy - 93)], fill=(255, 255, 255, 255))

    # Tail feathers (elegant arching plumes)
    tail_colors = [(16, 185, 129, 255), (37, 99, 235, 255), (52, 211, 153, 255)]
    draw.arc([(cx - 210, cy - 80), (cx - 70, cy + 90)], start=240, end=350, fill=tail_colors[0], width=12)
    draw.arc([(cx - 225, cy - 50), (cx - 80, cy + 110)], start=230, end=340, fill=tail_colors[1], width=10)
    draw.arc([(cx - 195, cy - 20), (cx - 85, cy + 125)], start=220, end=330, fill=tail_colors[2], width=9)

    # 5. Emerald inner border
    draw.rounded_rectangle([(16, 16), (size - 16, size - 16)], radius=102, 
                           outline=(52, 211, 153, 180), width=3)

    # 6. Create Round Version
    round_mask = Image.new('L', (size, size), 0)
    round_draw = ImageDraw.Draw(round_mask)
    round_draw.ellipse([(8, 8), (size - 8, size - 8)], fill=255)
    
    round_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_icon.paste(icon, (0, 0), round_mask)

    return icon, round_icon

if __name__ == '__main__':
    icon, round_icon = create_flock_icon()
    res_dir = r"E:\dwonload\el-mashroua-almalia-main\el-mashroua-almalia-main\flock-android\app\src\main\res"
    
    densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    for folder, dim in densities.items():
        target_dir = os.path.join(res_dir, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        sq = icon.resize((dim, dim), Image.Resampling.LANCZOS)
        sq.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")
        
        rd = round_icon.resize((dim, dim), Image.Resampling.LANCZOS)
        rd.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")
        print(f"Generated {folder}: {dim}x{dim}")

    # Also save a 512x512 preview in artifacts
    icon.save(r"C:\Users\Mohamed Ehap\.gemini\antigravity\brain\360318e2-0e2e-4630-b446-1d907357563d\flock_icon_512.png", "PNG")
    print("Done!")
