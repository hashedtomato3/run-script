from PIL import Image, ImageDraw
import os

images_dir = r"d:\NoSync\run-script\RunScript\images"
os.makedirs(images_dir, exist_ok=True)

sizes = [16, 48, 128]
primary_blue = (0, 120, 212)
white = (255, 255, 255)

for size in sizes:
    # Create transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded background square
    padding = size // 10
    
    # Draw background
    draw.rectangle(
        [padding, padding, size - padding, size - padding],
        fill=primary_blue,
        outline=None
    )
    
    # Draw code symbol (angle brackets)
    line_width = max(1, size // 12)
    
    if size >= 32:
        # For larger icons, draw detailed brackets
        inner_pad = size // 4
        mid_x = size // 2
        mid_y = size // 2
        
        # Left angle bracket
        x1, y1 = inner_pad, inner_pad
        x2, y2 = mid_x, mid_y
        x3, y3 = inner_pad, size - inner_pad
        draw.line([(x1, y1), (x2, y2), (x3, y3)], fill=white, width=line_width)
        
        # Right angle bracket
        x1, y1 = size - inner_pad, inner_pad
        x2, y2 = mid_x, mid_y
        x3, y3 = size - inner_pad, size - inner_pad
        draw.line([(x1, y1), (x2, y2), (x3, y3)], fill=white, width=line_width)
    else:
        # Smaller icon - simpler design
        inner_pad = size // 5
        draw.line(
            [(inner_pad, inner_pad), (size - inner_pad, size // 2), (inner_pad, size - inner_pad)],
            fill=white,
            width=line_width
        )
    
    img.save(os.path.join(images_dir, f'icon-{size}.png'), 'PNG')
    print(f'✓ icon-{size}.png generated')

print('\nAll icons created successfully!')
