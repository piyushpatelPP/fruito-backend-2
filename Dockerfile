# Use correct image (your previous one was wrong)
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Copy everything
COPY . .

# Give permission to gradlew
RUN chmod +x ./gradlew

# Build jar
RUN ./gradlew clean bootJar --no-daemon

# Expose port
EXPOSE 8080

# Run jar (SAFE way)
CMD ["sh", "-c", "java -jar build/libs/*.jar"]