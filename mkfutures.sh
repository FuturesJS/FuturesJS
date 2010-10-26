#!/bin/bash

cd lib

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  util.js \
  deprecated.js \
  futures.js > futures.deprecated.js

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  util.js \
  futures.js > futures.all.js

cat ../vendor/require-kiss.js \
  private.js \
  promise.js \
  subscription.js \
  chainify.js \
  futures.js > futures.core.js
