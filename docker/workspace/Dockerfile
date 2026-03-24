FROM node:22-alpine
RUN apk add --no-cache git bash curl openssh-client python3 make g++
RUN deluser --remove-home node \
    && addgroup -g 1000 -S workspace && adduser -u 1000 -S workspace -G workspace -s /bin/bash
WORKDIR /workspace
RUN mkdir -p /home/workspace/.npm && chown workspace:workspace /home/workspace/.npm \
    && printf 'bind "set enable-bracketed-paste off"\nPS1="\\h:\\w\\$ "\n' > /home/workspace/.bashrc \
    && chown workspace:workspace /home/workspace/.bashrc
COPY docker/workspace/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV TERM=xterm-256color HOME=/home/workspace npm_config_cache=/home/workspace/.npm
USER workspace
ENTRYPOINT ["/entrypoint.sh"]
CMD ["sleep", "infinity"]
