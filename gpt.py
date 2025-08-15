import os
import re
import shlex
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key="YOUR_API_KEY_HERE")

# All files to update
FILES = [
    "index.html",
    "about.html",
    "groups.html",
    "contact.html",
    "donation.html",
    "faq.html",
    "partials.html",
    "js/includes.js",
    "js/custom.js",
]

IMAGES_FOLDER = "./images"

# Load CMCA_info
with open("CMCA_info.txt", "r", encoding="utf-8") as f:
    CMCA_info = f.read()

def list_images(root="./images"):
    exts = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"}
    paths = []
    if os.path.isdir(root):
        for base, _, files in os.walk(root):
            for name in files:
                if os.path.splitext(name)[1].lower() in exts:
                    rel = os.path.join(base, name).replace("\\", "/")
                    paths.append(rel)
    return sorted(paths)

def ask_gpt_multi(file_map, instruction, images_index):
    """
    Send multiple files + images index to GPT and ask for minimal changes.
    GPT may return updated file blocks and optional system commands.
    """
    file_list_text = "\n\n".join(
        f"--- {name} ---\n{content}" for name, content in file_map.items()
    )
    images_text = "\n".join(images_index) if images_index else ""

    prompt = f"""
You are a senior web developer working on CMCA's website.

Task (make minimal edits only):
{instruction}

CMCA_info:
{CMCA_info}

Project files are provided below. Each file begins with:
--- filename ---

Rules:
1) Make only the minimal changes required to satisfy the task.
2) Return ONLY files that changed, using the exact format:
   --- filename ---
   <updated file content>
3) If no files require changes, return:
   --- NO_CHANGES ---
4) If you need to operate on images, include a final block:
   --- SYSTEM_COMMANDS ---
   <one command per line>

Image operations allowed (paths must be within ./images):
- rm ./images/<file>
- mv ./images/<old> ./images/<new>
- mkdir ./images/<dir>
- rmdir ./images/<dir>

Here are the current files:
{file_list_text}

--- IMAGES_INDEX ---
{images_text}
"""

    resp = client.chat.completions.create(
        model="gpt-5",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content

def parse_and_write(output_text, original_map):
    """
    Parse GPT output into file blocks and optional system commands.
    Overwrite only changed files. Execute whitelisted image commands.
    """
    # Separate optional SYSTEM_COMMANDS
    if "--- SYSTEM_COMMANDS ---" in output_text:
        file_section, commands_section = output_text.split("--- SYSTEM_COMMANDS ---", 1)
        system_commands = [line.strip() for line in commands_section.strip().splitlines() if line.strip()]
    else:
        file_section = output_text
        system_commands = []

    # If the model says no changes, exit early
    if re.search(r"---\s*NO_CHANGES\s*---", file_section):
        print("No changes reported by the model.")
        system_commands = system_commands  # still might run commands if any
    else:
        # Split file blocks by --- filename ---
        parts = re.split(r"---\s*(.*?)\s*---", file_section)
        # Expect ['', filename1, content1, filename2, content2, ...]
        for i in range(1, len(parts), 2):
            filename = parts[i].strip()
            content = parts[i + 1]

            if filename not in original_map:
                print(f"Skipped unknown file in output: {filename}")
                continue

            if content != original_map[filename]:
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated {filename}")
            else:
                print(f"No changes in {filename}")

    # Execute whitelisted system commands safely (images folder only)
    execute_image_commands(system_commands)

def is_within_images(path):
    images_root = os.path.realpath(IMAGES_FOLDER)
    target = os.path.realpath(path)
    return target.startswith(images_root + os.sep) or target == images_root

def execute_image_commands(commands):
    if not commands:
        return
    for cmd in commands:
        try:
            tokens = shlex.split(cmd)
            if not tokens:
                continue
            op = tokens[0].lower()

            # rm ./images/file
            if op in ("rm", "del") and len(tokens) == 2:
                target = tokens[1]
                if is_within_images(target) and os.path.isfile(target):
                    os.remove(target)
                    print(f"Removed {target}")
                else:
                    print(f"Skipped unsafe or missing path: {target}")

            # mv ./images/old ./images/new
            elif op in ("mv", "move") and len(tokens) == 3:
                src, dst = tokens[1], tokens[2]
                if is_within_images(src) and is_within_images(dst):
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    os.replace(src, dst)
                    print(f"Moved {src} -> {dst}")
                else:
                    print(f"Skipped unsafe move: {cmd}")

            # mkdir ./images/dir
            elif op == "mkdir" and len(tokens) == 2:
                target = tokens[1]
                if is_within_images(target):
                    os.makedirs(target, exist_ok=True)
                    print(f"Created directory {target}")
                else:
                    print(f"Skipped unsafe mkdir: {target}")

            # rmdir ./images/dir (only if empty)
            elif op in ("rmdir",) and len(tokens) == 2:
                target = tokens[1]
                if is_within_images(target) and os.path.isdir(target):
                    try:
                        os.rmdir(target)
                        print(f"Removed directory {target}")
                    except OSError:
                        print(f"Directory not empty or cannot remove: {target}")
                else:
                    print(f"Skipped unsafe rmdir: {target}")

            else:
                print(f"Ignored unsupported command: {cmd}")

        except Exception as e:
            print(f"Command failed: {cmd} ({e})")

if __name__ == "__main__":
    # Ask the user what to change
    user_instruction = input("Describe the change you want to make: ").strip()
    if not user_instruction:
        print("No instruction provided. Exiting.")
        raise SystemExit(0)

    # Read all files into a dictionary
    file_map = {name: open(name, "r", encoding="utf-8").read() for name in FILES}

    # Build images index for the model
    images_index = list_images(IMAGES_FOLDER)

    # Send request to GPT
    updated_text = ask_gpt_multi(file_map, user_instruction, images_index)

    # Parse and write updates
    parse_and_write(updated_text, file_map)

    print("Done.")
