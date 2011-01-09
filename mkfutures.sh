#!/bin/bash

# browser-dirname.js is required for all modules

mkdir -p release
cat \
  vendor/require-kiss.js \
  lib/browser-dirname.js \
  lib/future.js \
  lib/join.js \
  lib/sequence.js \
  lib/emitter.js \
  lib/asyncify.js \
  lib/chainify.js \
  lib/loop.js \
  lib/index.js \
  > release/futures.all.js

cat \
  examples/asyncify.js \
  examples/futures.js \
  examples/loop.js \
  examples/promise.js \
  examples/sequence.js \
  examples/emitter.js \
  examples/join.js \
  examples/chainify.js \
  examples/subscription.js \
  > release/futures.tests.all.js
sed -i "s:/../lib:futures:g" release/futures.tests.all.js
