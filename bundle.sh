#!/bin/bash

echo "Bump version in manifest"
read

rm -rf upload upload.zip
mkdir upload

cp -f background.js build.js* config.js content-script.js icon-* import.js\
    manifest.json popup.html post-data.js upload

mkdir upload/jspm_packages

cp -f jspm_packages/system.src.js upload/jspm_packages

pushd upload
    zip -r upload.zip .
    mv upload.zip ..
popd

