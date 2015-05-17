#if ! pgrep -f mongod; then
#  mongod --dbpath /home/siro/mongodb &
#fi

PIROOT=`pwd`/PIAMAD
LIROOT=`pwd`/licode
ROOT=`pwd`/licode
BUILD_DIR=$ROOT/build
CURRENT_DIR=`pwd`
EXTRAS=$ROOT/extras
DB_DIR="$BUILD_DIR"/db


export PATH=$PATH:/usr/local/sbin


if ! pgrep mongod; then
    echo Starting mongodb
    if [ ! -d "$DB_DIR" ]; then
      mkdir -p "$DB_DIR"/db
    fi
#    mongod --repair --dbpath $DB_DIR
    mongod --dbpath $DB_DIR --logpath $BUILD_DIR/mongo.log --fork
    sleep 2
  else
    echo [licode] mongodb already running, make sure this is the licode db instance
fi

if ! pgrep -f rabbitmq; then
  echo ''
  su -c "rabbitmq-server > $BUILD_DIR/rabbit.log & nginx -c $CURRENT_DIR/nginx.conf"
fi

sleep 3

cd $LIROOT/nuve
./initNuve.sh

sleep 3

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ROOT/erizo/build/erizo:$ROOT/erizo:$ROOT/build/libdeps/build/lib
export ERIZO_HOME=/erizo/

cd $LIROOT/erizo_controller
./initErizo_controller.sh

cp -fv $LIROOT/erizo_controller/erizoClient/dist/erizo.js $PIROOT/app/public/js/
cp -fv $LIROOT/nuve/nuveClient/dist/nuve.js $PIROOT/

echo [licode] Done.