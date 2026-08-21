FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw --batch-mode dependency:go-offline
COPY src src
RUN ./mvnw --batch-mode package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Python executes the visualization scripts that are mounted from JH_Codebase.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip libgomp1 fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*
COPY requirements-docker.txt /tmp/requirements-docker.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements-docker.txt

RUN useradd --system --uid 10001 appuser
COPY --from=build /app/target/rail-line-backend-0.0.1-SNAPSHOT.jar /app/app.jar
ENV PATH="/opt/venv/bin:${PATH}" \
    MPLBACKEND=Agg \
    PYTHONIOENCODING=UTF-8 \
    PYTHONUTF8=1
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
