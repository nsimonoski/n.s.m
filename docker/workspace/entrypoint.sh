#!/bin/sh
chown -R workspace:workspace /workspace
git config --global --add safe.directory /workspace
exec su-exec workspace "$@"
