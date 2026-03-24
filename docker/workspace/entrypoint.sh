#!/bin/sh
git config --global --add safe.directory /workspace
exec "$@"
