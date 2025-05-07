#!/bin/bash

echo "Missing documentation in examples directory:"
echo "----------------------------------------"

# Find all sensors in node-examples
find node-examples -name "readme.md" -type f | while read -r file; do
    sensor_name=$(basename $(dirname "$file"))
    if [ ! -f "examples/${sensor_name}.md" ]; then
        echo "- ${sensor_name}"
    fi
done
