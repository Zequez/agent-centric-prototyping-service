#!/bin/sh
source  $(dirname $0)/ssh_server.sh
ssh_server 'cd /root/server && git pull && systemctl restart server.service'
