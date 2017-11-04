#!/bin/bash

dir="$(dirname "$0")"
. "$dir/../docker.config"

if [[ $(docker ps -a | grep -w "$dockerImageName" | grep -w "$dockerContainerName") ]]; then
    docker stop "$dockerContainerName"
else
    echo 'there is no container with this name using the required image'
fi
