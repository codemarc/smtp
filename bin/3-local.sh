#!/bin/bash
namesp=smtp
estate="rancher-desktop"
context=$(kubectl config current-context)

echo Context is set to $context
echo
if [ ! "$context" = "$estate" ]; then
  echo Context is not set to "$estate"
  kubectl config use-context "$estate"
  echo
  read -p "Press enter to retry..."
  echo $0
  $0
fi

# create the namespace and make it active
kubectl create namespace $namesp 2>/dev/null
kubectl config set-context --current --namespace=$namesp

# and the registry credentials
source ./bin/1-login.sh
kubectl create secret docker-registry ghcr --docker-server=ghcr.io --docker-username=$valu --docker-password=$valp

# and the aws ses auth
kubectl create secret generic aws-ses --from-literal=SES_USER=AKIAZMFOX7XZIUC6NAPP --from-literal=SES_PASSWORD=BNM1cB92RwYp40z01i8IRxm+aa33k0Atn9h4ONdtzI/u

# and the configmap for the environment parameters
kubectl create -f ./_yaml/configmap-exim4.yaml

# and the smtp relay deployment
kubectl create -f ./_yaml/deployment-relay.yaml
