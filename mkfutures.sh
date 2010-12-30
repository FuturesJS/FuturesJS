#!/bin/bash

cd lib

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  util.js \
  deprecated.js \
  index.js > futures.deprecated.js

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  util.js \
  index.js > futures.all.js

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  index.js > futures.core.js
