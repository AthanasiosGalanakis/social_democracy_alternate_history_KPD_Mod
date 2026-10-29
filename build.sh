#!/bin/sh
# Build the game and copy game.json next to index.html (as the Pages workflow does).
timeout 120 npx dendrynexus make-html "$@" && cp out/game.json out/html/
