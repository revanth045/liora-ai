import os
import glob

# Map Windows-1252 bytes (0x80-0x9F) to their Unicode equivalents
CP1252_MAP = {
    0x80: '\u20ac', 0x82: '\u201a', 0x83: '\u0192', 0x84: '\u201e',
    0x85: '\u2026', 0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02c6',
    0x89: '\u2030', 0x8a: '\u0160', 0x8b: '\u2039', 0x8c: '\u0152',
    0x8e: '\u017d', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201c',
    0x94: '\u201d', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
    0x98: '\u02dc', 0x99: '\u2122', 0x9a: '\u0161', 0x9b: '\u203a',
    0x9c: '\u0153', 0x9e: '\u017e', 0x9f: '\u0178',
}

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Try decoding as UTF-8 first
    try:
        data.decode('utf-8')
        return False  # Already valid UTF-8
    except UnicodeDecodeError:
        pass
    
    # Fix: decode byte-by-byte, replacing invalid sequences
    result = []
    i = 0
    while i < len(data):
        b = data[i]
        
        # ASCII
        if b < 0x80:
            result.append(chr(b))
            i += 1
            continue
        
        # Try to decode as UTF-8 multi-byte sequence
        for seq_len in (4, 3, 2):
            if i + seq_len <= len(data):
                try:
                    char = data[i:i+seq_len].decode('utf-8')
                    result.append(char)
                    i += seq_len
                    break
                except UnicodeDecodeError:
                    continue
        else:
            # Single byte in 0x80-0xFF that's not part of valid UTF-8
            if b in CP1252_MAP:
                result.append(CP1252_MAP[b])
            elif 0xa0 <= b <= 0xff:
                # Latin-1 range
                result.append(chr(b))
            else:
                result.append(' ')  # Replace unknown with space
            i += 1
    
    text = ''.join(result)
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    return True

root = r'c:\Users\revanth045\Desktop\Liora Final\lyra\liora-main'
fixed = 0
for ext in ('*.tsx', '*.ts', '*.js', '*.jsx', '*.html', '*.json', '*.css', '*.md'):
    for filepath in glob.glob(os.path.join(root, '**', ext), recursive=True):
        if 'node_modules' in filepath:
            continue
        if fix_file(filepath):
            print(f'Fixed: {os.path.relpath(filepath, root)}')
            fixed += 1

print(f'\nTotal fixed: {fixed}')
