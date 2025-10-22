#!/bin/bash
set -e

CLUSTER_NAME="oracle-cluster"
SERVICE_NAME="oracle-db-service"
TASK_FILE="ecs/oracle-task.json"
IMAGE_NAME="gaspergt/oracle-db:latest"

# Actualiza la imagen en la definición JSON
sed -i "s|\"image\": \".*\"|\"image\": \"$IMAGE_NAME\"|" $TASK_FILE

# Registra nueva versión de la Task Definition
TASK_REVISION=$(aws ecs register-task-definition \
  --cli-input-json file://$TASK_FILE \
  --query "taskDefinition.revision" \
  --output text)

echo "Nueva revisión creada: $TASK_REVISION"

# Actualiza el servicio ECS
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition oracle-db-task:$TASK_REVISION

echo "Servicio ECS actualizado con la nueva imagen."
