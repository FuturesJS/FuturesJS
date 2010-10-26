#!/bin/bash

cd lib

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  util.js \
  chainify.js \
  deprecated.js \
  futures.js > futures.all.js

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  futures.js > futures.core.js
