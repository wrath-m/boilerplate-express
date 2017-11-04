#!/bin/bash

dir="$(dirname "$0")"
. "$dir/../docker.config"
rootFolder="$(realpath "$dir/../")"

echo "$dockerUser ALL=(ALL) NOPASSWD: ALL" >> "$rootFolder/sudoers"
cp "$rootFolder/Dockerfile.template" "$rootFolder/Dockerfile"
sed -i "s#<<REPLACE_WITH_DOCKER_IMAGE_FROM>>#$dockerImageFrom#g" "$rootFolder/Dockerfile"
sed -i "s#<<REPLACE_WITH_DOCKER_USER>>#$dockerUser#g" "$rootFolder/Dockerfile"

docker build --rm -t "$dockerImageName" "$rootFolder/."

docker rmi $(docker images -f dangling=true -q) > /dev/null 2>&1
rm "$rootFolder/Dockerfile"
rm "$rootFolder/sudoers"