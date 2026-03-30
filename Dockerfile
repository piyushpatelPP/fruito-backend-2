FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Copy project
COPY . .

# Give permission
RUN chmod +x ./gradlew

# Build jar
RUN ./gradlew clean bootJar --no-daemon

# Run correct jar (IMPORTANT)
CMD ["java", "-jar", "build/libs/fruito-backend-0.0.1-SNAPSHOT.jar"]