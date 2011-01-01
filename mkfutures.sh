#!/bin/bash

mkdir -p release
cat \
  vendor/require-kiss.js \
  vendor/persevere/global-es5.js \
  lib/future.js \
  lib/join.js \
  lib/sequence.js \
  lib/emitter.js \
  lib/index.js \
  > release/futures.all.js
