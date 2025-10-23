FROM gvenzl/oracle-xe:21-slim

# Variables base (no recrean PDB, solo configuran el usuario principal)
ENV ORACLE_PASSWORD=simon
ENV APP_USER=app_user
ENV APP_USER_PASSWORD=simon

EXPOSE 1521
