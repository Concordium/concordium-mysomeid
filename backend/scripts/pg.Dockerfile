FROM postgres

ENV POSTGRES_PASSWORD password

COPY backend/resources/create-db.sql /docker-entrypoint-initdb.d/
