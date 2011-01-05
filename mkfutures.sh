#!/bin/bash

# browser-dirname.js is required for all modules

mkdir -p release
cat \
  vendor/require-kiss.js \
  vendor/persevere/global-es5.js \
  lib/browser-dirname.js \
  lib/future.js \
  lib/join.js \
  lib/sequence.js \
  lib/emitter.js \
  lib/asyncify.js \
  lib/modelify.js \
  lib/loop.js \
  lib/index.js \
  > release/futures.all.js
