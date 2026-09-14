#!/usr/bin/env python3
"""Build a zip file from a JSON spec for security regression tests.

Usage: python3 build_zip.py <output_zip> <spec_json>

Spec is a JSON array of entries:
  {"name": "path/in/zip", "content": "bytes-or-str", "type": "file|dir|symlink"}
  - file: regular file (mode 0644)
  - dir: directory entry (mode 0755, name should end with "/")
  - symlink: symbolic link entry (mode 120777), content is the link target
"""
import json
import sys
import zipfile


def main():
    out_path = sys.argv[1]
    spec = json.loads(sys.argv[2])

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        for entry in spec:
            name = entry["name"]
            etype = entry.get("type", "file")
            content = entry.get("content", "")
            if isinstance(content, str):
                content = content.encode("utf-8")

            info = zipfile.ZipInfo(name)
            info.create_system = 3  # Unix
            if etype == "symlink":
                # 0o120777 = symlink; external_attr stores mode in high 16 bits
                info.external_attr = (0o120777 << 16)
            elif etype == "dir":
                info.external_attr = (0o040755 << 16)
            else:
                info.external_attr = (0o100644 << 16)
            z.writestr(info, content)


if __name__ == "__main__":
    main()