#!/bin/bash
workload=$(kubectl get pods -o json | jq '.items[0].metadata.name' | tr -d '"')
kubectl exec $workload -i -t -- /home/node/health.js $1 $2
