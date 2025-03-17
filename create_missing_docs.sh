#!/bin/bash

# Create examples directory if it doesn't exist
mkdir -p examples

# Template content
create_template() {
    local sensor=$1
    cat > "examples/${sensor}.md" << EOF
# ${sensor}

## 概要

- TBD

## 使用パーツ

- TBD
EOF
}

# Find all sensors in node-examples and create template if missing
find node-examples -name "readme.md" -type f | while read -r file; do
    sensor_name=$(basename $(dirname "$file"))
    if [ ! -f "examples/${sensor_name}.md" ]; then
        echo "Creating template for ${sensor_name}..."
        create_template "$sensor_name"
    fi
done

echo "Done creating template files."
