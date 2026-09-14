#!/bin/bash
# A script to setup Azure AKS and install Coder
# Prerequisites: Azure CLI (az), kubectl, helm installed

# 1. Variables
RESOURCE_GROUP="MyCoderResourceGroup"
CLUSTER_NAME="MyCoderCluster"
LOCATION="eastus"
CODER_NAMESPACE="coder"

# 2. Create Azure Resource Group
echo "Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. Create AKS Cluster
# We enable managed identity and attach ACR if you need private images later
echo "Creating AKS Cluster (this may take 5-10 minutes)..."
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys

# 4. Get Credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME

# 5. Add Coder Helm Repo
echo "Installing Coder via Helm..."
helm repo add coder-v2 [https://helm.coder.com/v2](https://helm.coder.com/v2)
helm repo update

# 6. Install Coder
# We are installing with a LoadBalancer to get a public IP for the dashboard.
# In production, you would configure ingress and TLS certificates.
kubectl create namespace $CODER_NAMESPACE
helm install coder coder-v2/coder \
  --namespace $CODER_NAMESPACE \
  --set coder.service.type=LoadBalancer \
  --set coder.service.enableHttp=true

echo "Waiting for External IP..."
sleep 30
kubectl get svc coder -n $CODER_NAMESPACE
echo "Access the dashboard at the External IP listed above on port 80."
echo "Get the admin password with: kubectl get secret coder-admin-password -n $CODER_NAMESPACE -o jsonpath='{.data.password}' | base64 -d"
