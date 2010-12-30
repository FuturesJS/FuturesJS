#!/bin/sh

if [ -n "`which npm`" ]
then
  npm install futures
else
  mkdir -p ~/.node_libraries/
  cp -a lib ~/.node_libraries/futures
fi
