#!/bin/bash

dir="$(dirname "$0")"
. "$dir/../docker.config"
srcFolder="$(realpath "$dir/../src")"

runCommand="docker run --privileged -v "$srcFolder:/usr/src" -dit --name "$dockerContainerName""
if [[ "$dockerOptions" ]]; then
    runCommand="$runCommand $dockerOptions"
fi
runCommand="$runCommand "$dockerImageName""
$runCommand
