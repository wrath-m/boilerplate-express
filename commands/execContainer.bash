#!/bin/bash

dir="$(dirname "$0")"
. "$dir/../docker.config"

if [[ $1 ]]; then
    username="$1"
else
    username="$dockerUser"
fi

if [[ $(docker ps -a | grep -w "$dockerImageName" | grep -w "$dockerContainerName") ]]; then
    docker exec -u "$username" -it "$dockerContainerName" bash
else
    echo 'there is no container with this name using the required image'
fi
