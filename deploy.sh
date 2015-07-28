#!/bin/sh

#To maintain code legible with "modules", symlinks are used (so you render "module/view.jade" instead of "../../modules/module/views/view.jade"
#Same thing might apply to public folder in next commits.
#This will be auto-controlled by the core in future, but for now we have this simple script.
mkdir -p virtual/views
ln -s ../../core/server/views virtual/views/core
