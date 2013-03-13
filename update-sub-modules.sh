#!/bin/bash
BRANCH=$1;
if [ "$BRANCH" == "" ] ; then
  BRANCH=`git branch | grep \* | cut -f2 -d' '`
fi
if [ "$BRANCH" == "" ] ; then
  BRANCH="master"
fi
echo BRANCH $BRANCH

pushd js/gamepad.js
git pull
popd
pushd js/sparks.js
git pull
popd
pushd js/three.js
git pull
popd
pushd js/tween.js
git pull
popd
