#!/bin/bash

DELAY=25

mongosh <<EOF
var config = {
    "_id": "dbrs",
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "172.16.238.10:27017",
            "priority": 2
        },
        {
            "_id": 2,
            "host": "172.16.238.11:27017",
            "priority": 1
        },
        {
            "_id": 3,
            "host": "172.16.238.12:27017",
            "priority": 1
        }
    ]
};
rs.initiate(config, { force: true });
EOF

echo "****** Waiting for ${DELAY} seconds for replicaset configuration to be applied ******"

sleep $DELAY

mongosh mongodb://172.16.238.10:27017/admin < /scripts/init.js