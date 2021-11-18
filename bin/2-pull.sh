#!/bin/bash
nerdctl -n k8s.io pull ghcr.io/buildinglink/baseline:latest

kim build -t "ghcr.io/buildinglink/email/smtp:latest" .

nerdctl -n k8s.io images | grep ghcr
