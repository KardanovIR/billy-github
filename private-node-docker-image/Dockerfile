FROM openjdk:8-jre-slim

ENV APP_HOME=/opt/waves
WORKDIR $APP_HOME

COPY waves.custom.conf $APP_HOME/waves.conf
RUN apt-get update && apt-get install -y curl jq wget \
    && JAR_REMOTE_PATH=$(curl "https://api.github.com/repos/wavesplatform/Waves/releases" \
        | jq -r '[.[] | select(.tag_name == "v1.1.11")] | first.assets[] | select(.name|endswith(".jar")) | .browser_download_url') \
    && echo "Downloading '$JAR_REMOTE_PATH'. This may take a few minutes..." \
    && wget $JAR_REMOTE_PATH -qO $APP_HOME/waves.jar
EXPOSE 6867 16971
ENTRYPOINT ["java", "-jar", "waves.jar", "waves.conf"]
