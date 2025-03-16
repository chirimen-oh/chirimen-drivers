#!/bin/bash

# Create docs directory if it doesn't exist
mkdir -p docs

# Remove existing files
rm -f docs/index.md
rm -f docs/*.md

# Create index.md with header
echo "# CHIRIMEN Drivers Documentation" > docs/index.md
echo -e "\n## センサー一覧\n" >> docs/index.md

# Find all readme.md files and process them
find node-examples -name "readme.md" -type f | sort | while read -r file; do
    # Extract directory name (sensor name)
    sensor_name=$(basename $(dirname "$file"))
    sensor_dir=$(dirname "$file")
    output_file="docs/${sensor_name}.md"

    # Add to index.md
    echo "- [${sensor_name}](./${sensor_name}.md)" >> docs/index.md

    # Add sensor name as header to individual file
    echo -e "# ${sensor_name}" > "$output_file"

    # Add content from examples/*.md if it exists, skipping first 3 lines
    example_md="examples/${sensor_name}.md"
    if [ -f "$example_md" ]; then
        echo -e "\n" >> "$output_file"
        tail -n +4 "$example_md" >> "$output_file"
        echo -e "\n" >> "$output_file"
    fi

    # Initialize flag for first heading
    read_first_heading=false

    # Read the readme file line by line and modify image paths
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip the first heading as we already added it
        if [[ $line =~ ^#[^#] ]] && ! $read_first_heading; then
            read_first_heading=true
            continue
        fi

        # If the line contains an image reference, update the path
        if [[ $line =~ !\[.*\]\(\./(.*)\) ]]; then
            # Replace ./image with ../node-examples/sensor_name/image
            modified_line=${line/.\//..\/$(echo $sensor_dir)\/}
            echo "$modified_line" >> "$output_file"
        else
            echo "$line" >> "$output_file"
        fi
    done < "$file"

    # Add main.js source code if it exists
    main_js="${sensor_dir}/main.js"
    if [ -f "$main_js" ]; then
        echo -e "\n## サンプルコード (main.js)\n" >> "$output_file"
        echo -e '```javascript' >> "$output_file"
        cat "$main_js" >> "$output_file"
        echo -e '```\n' >> "$output_file"
    fi

    # Add back to index link
    echo -e "\n---\n[← 目次に戻る](./index.md)" >> "$output_file"
done

# Add footer to index.md
echo -e "\n---\n" >> docs/index.md

# Make the script executable
chmod +x collect_docs.sh
