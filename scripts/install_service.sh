#!/bin/sh
cp ../services/server.service /etc/systemd/system/server.service
systemctl enable server.service
systemctl daemon-reload
systemctl restart server.service
