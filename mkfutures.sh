#!/bin/bash

mkdir -p release
cat \
  vendor/require-kiss.js \
  vendor/global-es5.js \
  lib/subscription.js \
  lib/promise.js \
  lib/join.js \
  lib/sequence.js \
  lib/emitter.js \
  lib/index.js \
  > release/futures.all.js
