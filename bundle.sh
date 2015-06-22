#!/bin/bash

mkdir upload

cp -f background.js build.js* config.js content-script.js icon-* import.js\
    manifest.json popup.html post-active-tests.js upload

pushd upload
    zip -r upload.zip .
    mv upload.zip ..
popd

