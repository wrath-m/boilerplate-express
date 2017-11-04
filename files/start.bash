#!/bin/bash

# fix docker /sbin not in $PATH problem
export PATH="$PATH:/sbin:/usr/sbin:/usr/local/sbin"

# redirect port 80 to 3000
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

# npm
cd /usr/src
npm install
npm start