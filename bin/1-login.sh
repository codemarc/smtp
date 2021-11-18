#!/bin/bash
export lookup=http://vault.buildinglink.local/accounts/GITHUB2
export valu=$(curl -s --retry-connrefused --retry-delay 2 "$lookup" | jq '.user' | tr -d '"')
export valp=$(curl -s --retry-connrefused --retry-delay 2 "$lookup" | jq '.pat' | tr -d '"')
echo $valp | nerdctl login -u $valu --password-stdin ghcr.io
