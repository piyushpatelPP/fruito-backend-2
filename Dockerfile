# Use correct image (your previous one was wrong)
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Copy everything
COPY . .

# Give permission to gradlew
RUN chmod +x ./gradlew

# Build jar
RUN ./gradlew clean bootJar --no-daemon

# Run jar dynamically binding to Railway PORT
CMD ["sh", "-c", "java -Dserver.port=${PORT:8080} -jar build/libs/*.jar"]