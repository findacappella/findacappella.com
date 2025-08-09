from openai import OpenAI
import re

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
]

# Read guidelines
guidelines = """
Business website guidelines
Here's what we typically check for when reviewing business websites. Verifying this information helps us fight fraud and satisfy regulatory requirements.
Includes a description of goods or services
Reachable and not under construction
Not a generic website unrelated to the account (e.g. facebook.com)
Not selling or promoting restricted goods or services
"""

# Load CMCA_info
with open("CMCA_info.txt", "r", encoding="utf-8") as f:
    CMCA_info = f.read()

def ask_gpt_multi(file_map, instruction):
    """
    file_map: dict of {filename: filecontent}
    """
    # Build multi-file prompt
    file_list_text = "\n\n".join(
        f"--- {name} ---\n{content}" for name, content in file_map.items()
    )

    prompt = f"""
You are a senior web developer working for CMCA webpage.
{instruction}

CMCA_info:
{CMCA_info}

Guidelines:
{guidelines}

The project contains multiple HTML files. Each file starts with:
--- filename ---

Return the UPDATED files in the SAME format, starting with --- filename --- for each.
Do not omit any file.

{file_list_text}
"""

    response = client.chat.completions.create(
        model="gpt-5",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def parse_and_write(output_text):
    """
    Splits GPT output by --- filename --- markers and overwrites the files.
    """
    matches = re.split(r"---\s*(.*?)\s*---", output_text)
    # The split will give ['', filename1, content1, filename2, content2, ...]
    for i in range(1, len(matches), 2):
        filename = matches[i].strip()
        content = matches[i + 1].strip()
        if filename in FILES:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✅ Updated {filename}")
        else:
            print(f"⚠ Skipped unknown file in output: {filename}")

if __name__ == "__main__":
    # Read all files into a dictionary
    file_map = {}
    for file_name in FILES:
        with open(file_name, "r", encoding="utf-8") as f:
            file_map[file_name] = f.read()

    # Ask GPT to improve all files
    updated_text = ask_gpt_multi(
        file_map,
        "Improve all pages to meet the requirements from guidelines while keeping style consistent."
    )

    # Parse and overwrite files
    parse_and_write(updated_text)

    print("🎉 All files updated successfully!")


