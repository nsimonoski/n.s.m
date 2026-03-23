FROM node:22-alpine
RUN apk add --no-cache git bash curl openssh-client python3 make g++
RUN addgroup -S workspace && adduser -S workspace -G workspace
WORKDIR /workspace
RUN chown workspace:workspace /workspace
RUN mkdir -p /home/workspace/.npm && chown workspace:workspace /home/workspace/.npm
USER workspace
ENV TERM=xterm-256color HOME=/home/workspace
CMD ["sleep", "infinity"]
