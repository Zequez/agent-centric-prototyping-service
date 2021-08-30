#!/bin/sh
source  $(dirname $0)/ssh_server.sh
ssh_server "tail -f -n 100 /root/server/logs/production.log"
