#!/bin/bash

set -e
set -u
set -x

# browser-dirname.js is required for all modules

mkdir -p release
cat \
  futures/future.js \
  futures/join.js \
  futures/sequence.js \
  futures/forEachAsync-standalone.js \
  futures/emitter.js \
  futures/asyncify.js \
  futures/chainify.js \
  futures/loop.js \
  futures/index.js \
  > release/futures.js

uglifyjs \
  release/futures.js \
  > release/futures.min.js

cat \
  vendor/require-kiss/lib/require-kiss.js \
  release/futures.js \
  > release/futures.all.js

uglifyjs \
  release/futures.all.js \
  > release/futures.all.min.js

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

set +x
echo ""
echo ""
echo "Awesomeness! Look in ./release for your futures build"
