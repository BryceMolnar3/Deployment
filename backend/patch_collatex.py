import os
import site
import sys

def patch_collatex():
    # Find the site-packages directory
    site_packages = site.getsitepackages()[0]
    collatex_path = os.path.join(site_packages, 'collatex')
    
    # Path to the file we need to patch
    linsuffarr_path = os.path.join(collatex_path, 'linsuffarr.py')
    
    # Read the file
    with open(linsuffarr_path, 'r') as f:
        content = f.read()
    
    # Replace getargspec with getfullargspec
    content = content.replace('from inspect  import getargspec', 'from inspect import getfullargspec')
    content = content.replace('getargspec', 'getfullargspec')
    
    # Write the modified content back
    with open(linsuffarr_path, 'w') as f:
        f.write(content)
    
    print(f"Successfully patched {linsuffarr_path}")

if __name__ == '__main__':
    patch_collatex() 