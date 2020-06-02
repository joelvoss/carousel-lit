#!/bin/bash
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# //////////////////////////////////////////////////////////////////////////////

# Default task (executed when no <task> argument was given)
function default {
  validate
  build
}

function start {
  node ./dist/index.js
}

function build {
  jvdx build rollup 'src/index.tsx' -f cjs,esm -c
}

function format {
  jvdx format "${@:1}"
}

function lint {
  jvdx lint "${@:1}"
}

function test {
  jvdx test
}

function validate {
  format "${@:1}"
  lint "${@:1}"
  test
}

function clean {
  jvdx clean dist example/dist example/node_modules example/yarn.lock "${@:1}"
}

# //////////////////////////////////////////////////////////////////////////////

function _now {
  time=$(date +'%H:%M:%S')
  printf "\033[2m[$time]\033[0m"
}

TASK=${@:-default}

printf "$(_now) \033[1m\033[96mTaskfile\033[0m $TASK\n\n"
${@:-default}
printf "\n"