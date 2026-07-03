def main():
    with open("static/index.html", "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    for i, line in enumerate(lines, 1):
        if "query_text" in line:
            print(f"{i}: {line.strip()}")

if __name__ == "__main__":
    main()
